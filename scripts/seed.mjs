import { randomBytes, scryptSync, createHash } from "node:crypto";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

/**
 * Register rows exactly as they appear in the institute's Excel file:
 * NAME | Registration Number | Certificate Collected | Year of Reg | CONTACT ADDRESS | TEL. NO | E-MAIL ADDRESS
 */
const FILE_ROWS = [
  ["OLOWOOKERE OLUWASEYI ISAAC", "3932/SILRM", "", "", "10, OLABIRORO STREET, OFF ALLEN AVENUE, IKEJA LAGOS", "8034297656", "lincolm202@yahoo.com"],
  ["IKENZE AUGUSTINE IFEANYI", "2743/SILRM", "", "", "P.M.B 80067", "8023854484", "zenkaf@yahoo.com"],
  ["UZOMBAH N. INNOCENT", "1A/SILRM", "", "", "41, IJOKO ROAD, OLORI , AKUTE, OGUN STATE.", "8033762820", "innobee2000@yahoo.com"],
  ["IDEM VICTOR EMMANUEL", "2333/SICRM", "", "", "C/O FIRST BANK OF NIG. PLC, UYO-ABAK ROAD, UYO, AKWA IBOM", "7066864594, 7031177721", "victorix76@yahoo.com"],
  ["UDUDUA OGHENEROBO COLLINS", "2587/MICRM", "", "", "GOLD PARKAGE PAY MICROFINANCE BANK LTD, PLOT 64, UGHELLI, DELTA STATE", "7032395196", "steconig@yahoo.com"],
  ["RUFAI BOSUN HAKEEM", "2810/MICRM", "", "", "P.O BOX, 7040, TRANS AMADI IND. LAYOUT PLOT 50E OMORELU, RIVERS STATE", "8033252383", "bosunrufai@yahoo.co.uk"],
  ["UDENKOLO JUDE NWANKWO", "3007/SICRM", "", "", "OCEANIC BANK INT'L PLC 15, GRACE BILL ROAD EKET, AKWA IBOM", "8035412309", "eagleklass@yahoo.com"],
  ["TINUOYE OLUSEGUN AYODEJI", "1955/MICRM", "", "", "21, HAMZAT OLUSEGUN AVENUE, BAIYEKU IKORODU ROAD, LAGOS", "8033283621", "tinuoye2000@yahoo.com"],
  ["AGBAJI BRIGHT IGWEBUIKE", "1809/MICRM", "", "", "21, ABISI VILLAGE, ABESAN ESTATE IPAJA, LAGOS.", "8037187918", "brightbuike2006@yahoo.com"],
  ["MOKA FRANCIS IKECHUKWU", "3410/MICRM", "", "", "INGLEWOOD ACADEMY, 50/52 IJALE ST, OWUTU IKORODU LAGOS", "8057907200", "mokfranny@yahoo.com"],
  ["ABEJIDE STEPHEN OLUSHOLA", "3591/MICRM", "", "", "6A, ALIMI-OKE STREET, OFF OSHODI RD, LAGOS. P.O. BOX 1738", "7065307393", "asostevei2001@yahoo.com"],
  ["OGBODO CHIKWENDU", "1638/MICRM", "", "", "37B, SALAWU STREET OFF RANDLE AVENUE, SURULERE- LAGOS", "8033358081, 08073153404", "ogbodoch@yahoo.com"],
  ["AKIN-OJO JOSEPH AKINYEMI", "1875/MICRM", "", "", "AFRIBANK NIGERIA PLC, 83, ALLEN AVENUE BRANCH, IKEJA LAGOS", "8023076595, 08072165345", "akinyemiojo2002@yahoo.com"],
  ["ELUSAKIN SINA EBENEZER", "233/MICRM", "", "", "NO 1/3 THEO OKUNUSI STREET, OTI-OLA, KETU LAGOS", "8023217980", "elusakinsina@yahoo.com"],
  ["OGUNGBUYI OLUWAFEMI DAVID", "1733/MICRM", "", "", "P.O. BOX 26849, IBADAN, OYO STATE.", "8033541435", "davids.femi@yahoo.co.uk"],
  ["AJOSE ESTHER YETUNDE", "2466/MICRM", "", "", "PLOT 4, BLK 8, FUNMI ALAKA DRIVE, MAGODO, ISHERI, LAGOS", "8023078571", "ajoseesther@yahoo.com"],
  ["IDAEWOR FREDDY AGBOKHAIWO", "2601/MICRM", "", "", "No. 29, LEMI GHARIOKWU AVENUE, OLAKITAN COMMAND, IPAJA, LAGOS", "8057876212", "idaeworfred@yahoo.co.uk"],
  ["JAIYESIMI AYODEJI ADEKUNLE", "1218/MICRM", "", "", "45, BRICKFIELD STREET, OFF APAPA ROAD EBUTE METTA (WEST), LAGOS", "8087854141", "bosnek069@yahoo.com"],
  ["ADESHINA BABATUNDE YISA", "1072/MICRM", "", "", "BANK PHB OTTA BRANCH, 82, IDIROKO ROAD, OTTA, OGUN STATE", "8023470639", "tundeadeshina@bankphb.com"],
  ["NZEAKOR NDUBISI JEREMAIH", "1576/MICRM", "", "", "INTERKEL NIG. LTD, 12, MAITAMA SULE STREET, IKOYI LAGOS", "8023773924", "nzeakorbisi08@gmail.com"],
  ["SALAWU MOHAMMED", "326/MICRM", "", "", "P.O.BOX 5279, IKEJA- LAGOS.", "8033340904", "msalawu@yahoo.com"],
  ["DADA BABATUNDE", "3969/SILRM", "", "", "C/O INTERCONTINENTAL BANK PLC, 24, NEW MARKET ROAD, ONITSHA, ANAMBRA", "8037031014", "daranife@gmail.com"],
  ["SULOLA BIDEMI ABDULRAHMAN", "3976/SILRM", "", "", "BULL PLAZA, 38/39, MARINA LAGOS.", "8056701048", "sba1us@yahoo.com"],
  ["IFEDIORA THANKGOD EMEKA", "3158/MICRM", "", "", "EQUITORIAL TRUST BANK LTD., 5, ALABA INT. MARKET ROAD, OJO, LAGOS", "08057704661/08058737669", "thankgod.ifediora@sterlingbankng.com"],
  ["NANNA EMMANUEL M.", "476/MICRM", "", "", "Diamond Bank Plc, Obosi Branch 8, BISCUIT ROAD, UGWUAGBA, ANAMBRA", "8037532321", "enanna@diamondbank.com"],
  ["OYEWOLE YEMI OYETUNJI", "4169/SILRM", "", "", "P.O BOX, 6919, GPO MARINA LAGOS", "8028763182", "yemiingod@hotmail.com"],
  ["FAKUNMOJU OLUMUYIWA ADEWALE", "4168/SILRM", "", "", "8, SAGAMU ROAD, IKORODU LAGOS", "8050878124", "defekuns2007@yahoo.com"],
  ["OYENIRAN LAWRENCE ALEJI", "4147/SILRM", "", "", "P.O BOX, 7103, SURULERE LAGOS", "8023874040", "oyeniranlaw2008@yahoo.com"],
  ["ABBA SANDA ZANNA", "2372/MICRM", "", "", "RAMAT POLYTECHNIC, DEPT OF BANKING &FINANCE P.O BOX, 2, MAIDUGURI, BORNO", "8057803612", "abbasandazanna@yahoo.com"],
];

function splitName(value) {
  const parts = (value ?? "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!parts.length) return { firstName: "", secondName: "", thirdName: "" };
  if (parts.length === 1) return { firstName: parts[0], secondName: "", thirdName: "" };
  if (parts.length === 2) return { firstName: parts[0], secondName: parts[1], thirdName: "" };
  return { firstName: parts[0], secondName: parts[1], thirdName: parts.slice(2).join(" ") };
}

const NIGERIAN_STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "Abuja", "FCT"];

function regionFromAddress(address) {
  const haystack = (address ?? "").toUpperCase();
  for (const state of NIGERIAN_STATES) {
    if (haystack.includes(state.toUpperCase())) return state === "FCT" ? "Abuja" : state;
  }
  return "";
}

const gradeOf = (reg) => {
  const match = (reg ?? "").toUpperCase().match(/([A-Z]{3,8})\s*$/);
  return match ? match[1] : "";
};

function toRecord(row) {
  const [name, memberId, certificateCollected, yearOfReg, contactAddress, phone, email] = row;
  const { firstName, secondName, thirdName } = splitName(name);
  const grade = gradeOf(memberId);
  return {
    name,
    firstName,
    secondName,
    thirdName,
    memberId,
    certificateCollected,
    yearOfReg,
    contactAddress,
    phone,
    email,
    grade,
    category: grade,
    status: "Active",
    region: regionFromAddress(contactAddress),
    title: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    employer: "",
    profession: "",
  };
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  await client.query(
    `insert into settings (id, org_name, short_name, tagline, logo_url, support_email, primary_color, require_verification, guest_search_fields, auto_backup, backup_frequency)
     values (1, $1, $2, $3, $4, $5, $6, true, $7::jsonb, true, 'daily')
     on conflict (id) do update set org_name = excluded.org_name, short_name = excluded.short_name, tagline = excluded.tagline,
       logo_url = excluded.logo_url, support_email = excluded.support_email, guest_search_fields = excluded.guest_search_fields`,
    [
      "Chartered Institute of Loan & Risk Management of Nigeria",
      "CILRMNG",
      "Minimizing Risks, Maximizing Opportunities",
      "/images/cilrm-logo.png",
      "info@cilrmng.org",
      "#EA580C",
      JSON.stringify(["memberId", "name", "firstName", "secondName", "thirdName", "email", "phone"]),
    ],
  );

  // No admin accounts are seeded — the first person to visit /setup performs the
  // one-time root sign-up and then registers the rest of the team.
  const memberCount = await client.query("select count(*)::int as total from members");
  if (memberCount.rows[0].total > 0) {
    console.log(`Seed skipped: ${memberCount.rows[0].total} members already present.`);
    await client.end();
    return;
  }

  const importRes = await client.query(
    `insert into imports (file_name, file_type, source, status, rows_total, rows_imported, rows_updated, rows_skipped, rows_failed, column_count, created_by_name, created_at)
     values ($1,'xlsx','upload','completed',$2,$2,0,0,0,7,$3, now() - interval '2 days') returning id`,
    ["CILRMNG-membership-register.xlsx", FILE_ROWS.length, "Registry office"],
  );
  const importId = importRes.rows[0].id;

  const records = FILE_ROWS.map(toRecord);
  const values = [];
  const params = [];
  let n = 1;
  for (const r of records) {
    values.push(`($${n++},$${n++},$${n++},$${n++},$${n++},$${n++},$${n++},$${n++},$${n++},$${n++},$${n++},$${n++},$${n++},$${n++},$${n++}::jsonb,$${n++}, now(), now())`);
    params.push(
      r.memberId,
      r.name,
      r.firstName,
      r.secondName,
      r.thirdName,
      [r.firstName, r.secondName, r.thirdName].filter(Boolean).join(" "),
      r.email,
      r.phone,
      r.contactAddress,
      r.certificateCollected,
      r.yearOfReg,
      r.grade,
      r.category,
      r.status,
      JSON.stringify(r),
      importId,
    );
  }
  await client.query(
    `insert into members (member_id, name, first_name, second_name, third_name, full_name, email, phone, contact_address,
       certificate_collected, year_of_reg, grade, category, status, data, import_id, created_at, updated_at)
     values ${values.join(",")} on conflict (member_id) do nothing`,
    params,
  );
  // Region is derived from the address text.
  for (const r of records) {
    if (r.region) await client.query("update members set region = $1 where member_id = $2", [r.region, r.memberId]);
  }

  const auditRows = [
    ["Registry office", "Uploaded membership file", `CILRMNG-membership-register.xlsx · ${FILE_ROWS.length} rows · 7 columns`, 2],
  ];
  for (const [actor, action, detail, days] of auditRows) {
    await client.query(
      `insert into audit_logs (actor_name, action, detail, created_at) values ($1,$2,$3, now() - interval '${days} days')`,
      [actor, action, detail],
    );
  }

  const serialized = JSON.stringify({ members: records, settings: { orgName: "Chartered Institute of Loan & Risk Management of Nigeria" } });
  const checksum = createHash("sha256").update(serialized).digest("hex");
  await client.query(
    `insert into backups (label, kind, location, row_count, size_bytes, checksum, payload, created_by_name, created_at)
     values ($1,'auto','encrypted-vault',$2,$3,$4,$5::jsonb,'system', now() - interval '1 day')`,
    ["Scheduled snapshot · nightly", records.length, Buffer.byteLength(serialized), checksum, serialized],
  );
  await client.query("update settings set last_auto_backup_at = now() - interval '1 day' where id = 1");

  const total = await client.query("select count(*)::int as total from members");
  console.log(`Seeded ${total.rows[0].total} CILRMNG register rows. No admins — visit /setup for the one-time root sign-up.`);
  await client.end();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
