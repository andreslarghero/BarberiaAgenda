const baseUrl = "http://localhost:3000";

async function request(method, path, token, body) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  let json = null;
  try {
    json = JSON.parse(raw);
  } catch (_e) {}

  return { ok: res.ok, status: res.status, raw, json };
}

function toIso(dateStr) {
  return new Date(dateStr).toISOString();
}

async function main() {
  const results = [];
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateOnly = `${yyyy}-${mm}-${dd}`;
  const dayOfWeek = today.getDay();

  const login = await request("POST", "/api/auth/login", null, {
    email: "admin@agendabarberia.com",
    password: "123456",
  });
  const token = login.json?.accessToken;
  results.push({
    step: "1.login admin",
    pass: Boolean(token),
    status: login.status,
    detail: token ? "token recibido" : login.raw,
  });

  if (!token) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Ensure baseline entities for tests
  await request("POST", "/api/services", token, {
    name: "Smoke Service E2E",
    description: "auto",
    durationMinutes: 30,
    price: 1500,
  });
  await request("POST", "/api/barbers", token, {
    name: "Smoke Barber E2E",
    phone: "1111111111",
    email: "smoke.barber.e2e@agenda.com",
    notes: "auto",
  });
  await request("POST", "/api/clients", token, {
    name: "Smoke Client E2E",
    phone: "2222222222",
    email: "smoke.client.e2e@agenda.com",
    notes: "auto",
  });

  const servicesRes = await request("GET", "/api/services", token);
  const barbersRes = await request("GET", "/api/barbers", token);
  const clientsRes = await request("GET", "/api/clients", token);

  const services = Array.isArray(servicesRes.json) ? servicesRes.json : [];
  const barbers = Array.isArray(barbersRes.json) ? barbersRes.json : [];
  const clients = Array.isArray(clientsRes.json) ? clientsRes.json : [];

  const serviceId = services[0]?.id;
  const barberId = barbers[0]?.id;
  const clientId = clients[0]?.id;

  results.push({
    step: "2.list services",
    pass: servicesRes.ok && services.length > 0,
    status: servicesRes.status,
    detail: `count=${services.length}`,
  });
  results.push({
    step: "3.list barbers",
    pass: barbersRes.ok && barbers.length > 0,
    status: barbersRes.status,
    detail: `count=${barbers.length}`,
  });
  results.push({
    step: "4.list clients",
    pass: clientsRes.ok && clients.length > 0,
    status: clientsRes.status,
    detail: `count=${clients.length}`,
  });

  if (!serviceId || !barberId || !clientId) {
    results.push({
      step: "data check",
      pass: false,
      status: 0,
      detail: `serviceId=${serviceId ?? ""} barberId=${barberId ?? ""} clientId=${clientId ?? ""}`,
    });
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const createSchedule = await request("POST", `/api/barbers/${barberId}/schedules`, token, {
    dayOfWeek,
    startTime: "09:00",
    endTime: "18:00",
    isWorkingDay: true,
  });
  results.push({
    step: "5.create schedule",
    pass: createSchedule.ok,
    status: createSchedule.status,
    detail: createSchedule.ok ? "created" : createSchedule.raw,
  });

  const blockStart = toIso(`${dateOnly}T12:00:00`);
  const blockEnd = toIso(`${dateOnly}T13:00:00`);
  const createBlocked = await request("POST", `/api/barbers/${barberId}/blocked-times`, token, {
    startDatetime: blockStart,
    endDatetime: blockEnd,
    reason: "Bloqueo smoke",
  });
  results.push({
    step: "6.create blocked-time",
    pass: createBlocked.ok,
    status: createBlocked.status,
    detail: createBlocked.ok ? "created" : createBlocked.raw,
  });

  const availability = await request(
    "GET",
    `/api/appointments/availability?barberId=${barberId}&date=${dateOnly}`,
    token
  );
  results.push({
    step: "7.availability",
    pass: availability.ok,
    status: availability.status,
    detail: availability.ok ? "ok" : availability.raw,
  });

  const startValid = toIso(`${dateOnly}T10:00:00`);
  const aValid = await request("POST", "/api/appointments", token, {
    clientId,
    barberId,
    serviceId,
    startDatetime: startValid,
    notes: "valido",
  });
  const appointmentId = aValid.json?.id;
  results.push({
    step: "8.create valid appointment",
    pass: aValid.ok,
    status: aValid.status,
    detail: aValid.ok ? `id=${appointmentId}` : aValid.raw,
  });

  const startOverlap = toIso(`${dateOnly}T10:10:00`);
  const aOverlap = await request("POST", "/api/appointments", token, {
    clientId,
    barberId,
    serviceId,
    startDatetime: startOverlap,
    notes: "overlap",
  });
  results.push({
    step: "9.overlap rejection",
    pass: aOverlap.status === 409 || aOverlap.status === 400,
    status: aOverlap.status,
    detail: aOverlap.ok ? "unexpectedly allowed" : aOverlap.raw,
  });

  const startBlocked = toIso(`${dateOnly}T12:10:00`);
  const aBlocked = await request("POST", "/api/appointments", token, {
    clientId,
    barberId,
    serviceId,
    startDatetime: startBlocked,
    notes: "blocked",
  });
  results.push({
    step: "10.blocked-time rejection",
    pass: aBlocked.status === 409 || aBlocked.status === 400,
    status: aBlocked.status,
    detail: aBlocked.ok ? "unexpectedly allowed" : aBlocked.raw,
  });

  if (appointmentId) {
    const cancel = await request("PATCH", `/api/appointments/${appointmentId}/cancel`, token, {
      reason: "smoke cancel",
    });
    results.push({
      step: "11.cancel appointment",
      pass: cancel.ok && cancel.json?.status === "CANCELLED",
      status: cancel.status,
      detail: cancel.ok ? `status=${cancel.json?.status}` : cancel.raw,
    });
  } else {
    results.push({
      step: "11.cancel appointment",
      pass: false,
      status: 0,
      detail: "skipped: no appointment id",
    });
  }

  const startComplete = toIso(`${dateOnly}T16:00:00`);
  const aToComplete = await request("POST", "/api/appointments", token, {
    clientId,
    barberId,
    serviceId,
    startDatetime: startComplete,
    notes: "to complete",
  });

  if (aToComplete.ok && aToComplete.json?.id) {
    const complete = await request(
      "PATCH",
      `/api/appointments/${aToComplete.json.id}/complete`,
      token
    );
    results.push({
      step: "12.complete appointment",
      pass: complete.ok && complete.json?.status === "COMPLETED",
      status: complete.status,
      detail: complete.ok ? `status=${complete.json?.status}` : complete.raw,
    });
  } else {
    results.push({
      step: "12.complete appointment",
      pass: false,
      status: aToComplete.status,
      detail: aToComplete.raw,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
