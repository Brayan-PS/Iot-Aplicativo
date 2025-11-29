function doGet(e) {

  var ss = SpreadsheetApp.openById("170SXVfp6G5mCd14afJkpcdbn4MjVYuutH4RXZwFABB8");
  var sheet = ss.getSheetByName("hoja");

  let temp     = e.parameter.temp;
  let hum      = e.parameter.hum;
  let co2      = e.parameter.co2;
  let nh3      = e.parameter.nh3;
  let nox      = e.parameter.nox;
  let alcohol  = e.parameter.alcohol;
  let benceno  = e.parameter.benceno;
  let humo     = e.parameter.humo;

  sheet.appendRow([
    new Date(),
    temp,
    hum,
    co2,
    nh3,
    nox,
    alcohol,
    benceno,
    humo
  ]);

  return ContentService.createTextOutput("OK");
}
