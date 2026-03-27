const dashboardRepository = require("./dashboard.repository");
const settingsService = require("../settings/settings.service");
const appointmentRepository = require("../appointments/appointment.repository");
const DEFAULT_COMMISSION_RATE = 0.4;

function parseDateInputToRange(dateInput) {
  const value = String(dateInput || "");
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  const fromDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  const toDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { fromDate, toDate };
}

function decimalToNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function pushRevenue(groupMap, key, name, amount) {
  const current = groupMap.get(key) || { id: key, name, revenue: 0 };
  current.revenue += amount;
  groupMap.set(key, current);
}

function sortRevenueDesc(items) {
  return items.sort((a, b) => b.revenue - a.revenue);
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday-based week
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function calculateRevenue(appointments) {
  return appointments.reduce((acc, appointment) => {
    return acc + decimalToNumber(appointment.service?.price);
  }, 0);
}

function shiftDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function previousMonthRange(date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const fromDate = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const toDate = new Date(y, m, 0, 23, 59, 59, 999);
  return { fromDate, toDate };
}

function toDelta(currentValue, previousValue, rounder = (v) => v) {
  const diff = rounder(currentValue - previousValue);
  const percentChange = previousValue === 0 ? null : rounder((diff / previousValue) * 100);
  return {
    current: rounder(currentValue),
    previous: rounder(previousValue),
    diff,
    percentChange,
  };
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(headers, rows) {
  const headerLine = headers.map(escapeCsv).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsv).join(","));
  return [headerLine, ...dataLines].join("\n");
}

async function getSummary(query) {
  const { fromDate, toDate } = parseDateInputToRange(query.date);
  const completedAppointments = await dashboardRepository.findCompletedAppointmentsInRange({
    fromDate,
    toDate,
  });

  const revenueByServiceMap = new Map();
  const revenueByBarberMap = new Map();
  let totalRevenueToday = 0;

  for (const appointment of completedAppointments) {
    const serviceName = appointment.service?.name || "Servicio desconocido";
    const serviceId = appointment.service?.id ?? 0;
    const barberName = appointment.barber?.fullName || "Barbero desconocido";
    const barberId = appointment.barber?.id ?? 0;
    const price = decimalToNumber(appointment.service?.price);

    totalRevenueToday += price;
    pushRevenue(revenueByServiceMap, serviceId, serviceName, price);
    pushRevenue(revenueByBarberMap, barberId, barberName, price);
  }

  return {
    date: query.date,
    totalRevenueToday: roundCurrency(totalRevenueToday),
    completedAppointmentsToday: completedAppointments.length,
    revenueByService: sortRevenueDesc(Array.from(revenueByServiceMap.values())),
    revenueByBarber: sortRevenueDesc(Array.from(revenueByBarberMap.values())),
  };
}

async function getOverview(query) {
  const { fromDate: dayStart, toDate: dayEnd } = parseDateInputToRange(query.date);
  const weekStart = startOfWeek(dayStart);
  const weekEnd = endOfWeek(dayStart);
  const monthStart = startOfMonth(dayStart);
  const monthEnd = endOfMonth(dayStart);
  const prevDayStart = shiftDays(dayStart, -1);
  const prevDayEnd = shiftDays(dayEnd, -1);
  const prevWeekStart = shiftDays(weekStart, -7);
  const prevWeekEnd = shiftDays(weekEnd, -7);
  const { fromDate: prevMonthStart, toDate: prevMonthEnd } = previousMonthRange(dayStart);

  const [todayRows, weekRows, monthRows, prevDayRows, prevWeekRows, prevMonthRows] = await Promise.all([
    dashboardRepository.findCompletedAppointmentsInRange({ fromDate: dayStart, toDate: dayEnd }),
    dashboardRepository.findCompletedAppointmentsInRange({ fromDate: weekStart, toDate: weekEnd }),
    dashboardRepository.findCompletedAppointmentsInRange({ fromDate: monthStart, toDate: monthEnd }),
    dashboardRepository.findCompletedAppointmentsInRange({ fromDate: prevDayStart, toDate: prevDayEnd }),
    dashboardRepository.findCompletedAppointmentsInRange({ fromDate: prevWeekStart, toDate: prevWeekEnd }),
    dashboardRepository.findCompletedAppointmentsInRange({ fromDate: prevMonthStart, toDate: prevMonthEnd }),
  ]);

  const totalRevenueToday = roundCurrency(calculateRevenue(todayRows));
  const totalRevenueWeek = roundCurrency(calculateRevenue(weekRows));
  const totalRevenueMonth = roundCurrency(calculateRevenue(monthRows));
  const prevRevenueDay = roundCurrency(calculateRevenue(prevDayRows));
  const prevRevenueWeek = roundCurrency(calculateRevenue(prevWeekRows));
  const prevRevenueMonth = roundCurrency(calculateRevenue(prevMonthRows));
  const completedToday = todayRows.length;
  const completedWeek = weekRows.length;
  const completedMonth = monthRows.length;
  const prevCompletedDay = prevDayRows.length;
  const prevCompletedWeek = prevWeekRows.length;
  const prevCompletedMonth = prevMonthRows.length;

  const revenueComparisonToday = toDelta(totalRevenueToday, prevRevenueDay, roundCurrency);
  const revenueComparisonWeek = toDelta(totalRevenueWeek, prevRevenueWeek, roundCurrency);
  const revenueComparisonMonth = toDelta(totalRevenueMonth, prevRevenueMonth, roundCurrency);
  const completedComparisonToday = toDelta(completedToday, prevCompletedDay, Math.round);
  const completedComparisonWeek = toDelta(completedWeek, prevCompletedWeek, Math.round);
  const completedComparisonMonth = toDelta(completedMonth, prevCompletedMonth, Math.round);

  return {
    date: query.date,
    totalRevenueToday,
    totalRevenueWeek,
    totalRevenueMonth,
    completedAppointmentsToday: completedToday,
    completedAppointmentsWeek: completedWeek,
    completedAppointmentsMonth: completedMonth,
    revenueDeltaToday: revenueComparisonToday.diff,
    revenueDeltaWeek: revenueComparisonWeek.diff,
    revenueDeltaMonth: revenueComparisonMonth.diff,
    completedDeltaToday: completedComparisonToday.diff,
    completedDeltaWeek: completedComparisonWeek.diff,
    completedDeltaMonth: completedComparisonMonth.diff,
    comparisons: {
      revenue: {
        today: revenueComparisonToday,
        week: revenueComparisonWeek,
        month: revenueComparisonMonth,
      },
      completed: {
        today: completedComparisonToday,
        week: completedComparisonWeek,
        month: completedComparisonMonth,
      },
    },
  };
}

async function getCommissions(query) {
  const { fromDate, toDate } = parseDateInputToRange(query.date);
  const settings = await settingsService.getSettings();
  const commissionRate = Number(settings?.defaultCommissionRate);
  const safeCommissionRate =
    Number.isFinite(commissionRate) && commissionRate >= 0 && commissionRate <= 1
      ? commissionRate
      : DEFAULT_COMMISSION_RATE;
  const completedAppointments = await dashboardRepository.findCompletedAppointmentsInRange({
    fromDate,
    toDate,
  });

  const byBarber = new Map();

  for (const appointment of completedAppointments) {
    const barberId = appointment.barber?.id ?? 0;
    const barberName = appointment.barber?.fullName || "Barbero desconocido";
    const price = decimalToNumber(appointment.service?.price);
    const current = byBarber.get(barberId) || {
      barberId,
      barberName,
      completedAppointments: 0,
      revenue: 0,
      commissionRate: safeCommissionRate,
      commissionAmount: 0,
    };
    current.completedAppointments += 1;
    current.revenue += price;
    current.commissionAmount += price * current.commissionRate;
    byBarber.set(barberId, current);
  }

  const items = Array.from(byBarber.values())
    .map((row) => ({
      ...row,
      revenue: roundCurrency(row.revenue),
      commissionAmount: roundCurrency(row.commissionAmount),
    }))
    .sort((a, b) => b.commissionAmount - a.commissionAmount);

  return {
    date: query.date,
    items,
  };
}

async function getAppointmentsExport(query) {
  const { fromDate, toDate } = parseDateInputToRange(query.date);
  const appointments = await appointmentRepository.findMany({
    startsAt: {
      gte: fromDate,
      lte: toDate,
    },
  });

  const headers = [
    "appointmentId",
    "startDatetime",
    "endDatetime",
    "status",
    "clientName",
    "barberName",
    "serviceName",
    "servicePrice",
  ];

  const rows = appointments.map((row) => [
    row.id,
    row.startsAt?.toISOString() || "",
    row.endsAt?.toISOString() || "",
    row.status || "",
    row.client?.fullName || "",
    row.barber?.fullName || "",
    row.service?.name || "",
    decimalToNumber(row.service?.price),
  ]);

  return toCsv(headers, rows);
}

async function getSummaryExport(query) {
  const [summary, overview] = await Promise.all([getSummary(query), getOverview(query)]);

  const headers = ["section", "key", "value"];
  const rows = [
    ["summary", "date", summary.date],
    ["summary", "totalRevenueToday", summary.totalRevenueToday],
    ["summary", "completedAppointmentsToday", summary.completedAppointmentsToday],
    ["overview", "totalRevenueWeek", overview.totalRevenueWeek],
    ["overview", "totalRevenueMonth", overview.totalRevenueMonth],
    ["overview", "completedAppointmentsWeek", overview.completedAppointmentsWeek],
    ["overview", "completedAppointmentsMonth", overview.completedAppointmentsMonth],
    ["overview", "revenueDeltaToday", overview.revenueDeltaToday],
    ["overview", "revenueDeltaWeek", overview.revenueDeltaWeek],
    ["overview", "revenueDeltaMonth", overview.revenueDeltaMonth],
    ["overview", "completedDeltaToday", overview.completedDeltaToday],
    ["overview", "completedDeltaWeek", overview.completedDeltaWeek],
    ["overview", "completedDeltaMonth", overview.completedDeltaMonth],
  ];

  for (const item of summary.revenueByService) {
    rows.push(["revenueByService", item.name, item.revenue]);
  }
  for (const item of summary.revenueByBarber) {
    rows.push(["revenueByBarber", item.name, item.revenue]);
  }

  return toCsv(headers, rows);
}

async function getCommissionsExport(query) {
  const result = await getCommissions(query);
  const headers = [
    "barberId",
    "barberName",
    "completedAppointments",
    "revenue",
    "commissionRate",
    "commissionAmount",
  ];
  const rows = result.items.map((item) => [
    item.barberId,
    item.barberName,
    item.completedAppointments,
    item.revenue,
    item.commissionRate,
    item.commissionAmount,
  ]);
  return toCsv(headers, rows);
}

module.exports = {
  getSummary,
  getOverview,
  getCommissions,
  getAppointmentsExport,
  getSummaryExport,
  getCommissionsExport,
};
