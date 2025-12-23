const db = require("../config/db");

exports.postLedger = ({
  company_id,
  ledger_id,
  voucher_type,
  voucher_no,
  voucher_date,
  debit = 0,
  credit = 0,
  narration,
}) => {
  db.run(
    `
    INSERT INTO ledger_entries (
      company_id, ledger_id,
      voucher_type, voucher_no, voucher_date,
      debit, credit, narration
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      company_id,
      ledger_id,
      voucher_type,
      voucher_no,
      voucher_date,
      debit,
      credit,
      narration,
    ]
  );

  // update ledger closing balance
  db.run(
    `
    UPDATE ledgers
    SET closing_balance = closing_balance + ? - ?
    WHERE id = ?
    `,
    [debit, credit, ledger_id]
  );
};
