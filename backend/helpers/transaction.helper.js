const db = require("../config/db");

exports.runTransaction = async (callback) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      callback(
        () => {
          db.run("COMMIT", (err) => {
            if (err) reject(err);
            resolve();
          });
        },
        (err) => {
          db.run("ROLLBACK");
          reject(err);
        }
      );
    });
  });
};
