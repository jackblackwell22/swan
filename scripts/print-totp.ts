import { TOTP, Secret } from "otpauth";

const secret = process.argv[2] || process.env.ADMIN1_TOTP_SECRET || "JBSWY3DPEHPK3PXP";
const totp = new TOTP({
  issuer: "Swan Street Lock-Ups",
  label: "test",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  secret: Secret.fromBase32(secret.replace(/\s+/g, "")),
});
console.log(totp.generate());
