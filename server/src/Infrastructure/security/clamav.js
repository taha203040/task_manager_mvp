// // import clamav from "clamav.js";

// // const Filescan = () => {
// //   clamav
// //     .createScanner(3310, "127.0.0.1")
// //     .scan("/uploads", function (err, object, malicious) {
// //       if (err) {
// //         console.log(object + ": " + err);
// //       } else if (malicious) {
// //         console.log(object + ": " + malicious + " FOUND");
// //       } else {
// //         console.log(object + ": OK");
// //       }
// //     });
// // };
// // export default Filescan;
// import { exec } from "child_process";

// export const filescanner = () => {
//   exec("clamscan /uploads/", (error, stdout, stderr) => {
//     if (error) {
//       console.error(`خطأ: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       console.error(`Stderr: ${stderr}`);
//       return;
//     }
//     console.log(`نتيجة الفحص:\n${stdout}`);
//   });
// };
