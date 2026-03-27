const dashboardService = require("./dashboard.service");

async function summary(req, res, next) {
  try {
    const data = await dashboardService.getSummary(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function commissions(req, res, next) {
  try {
    const data = await dashboardService.getCommissions(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function overview(req, res, next) {
  try {
    const data = await dashboardService.getOverview(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

function sendCsv(res, filename, csvText) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  // UTF-8 BOM helps Excel interpret accents correctly.
  res.status(200).send(`\uFEFF${csvText}`);
}

async function exportAppointments(req, res, next) {
  try {
    const csv = await dashboardService.getAppointmentsExport(req.query);
    sendCsv(res, `appointments-${req.query.date}.csv`, csv);
  } catch (error) {
    next(error);
  }
}

async function exportSummary(req, res, next) {
  try {
    const csv = await dashboardService.getSummaryExport(req.query);
    sendCsv(res, `summary-${req.query.date}.csv`, csv);
  } catch (error) {
    next(error);
  }
}

async function exportCommissions(req, res, next) {
  try {
    const csv = await dashboardService.getCommissionsExport(req.query);
    sendCsv(res, `commissions-${req.query.date}.csv`, csv);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  summary,
  overview,
  commissions,
  exportAppointments,
  exportSummary,
  exportCommissions,
};
