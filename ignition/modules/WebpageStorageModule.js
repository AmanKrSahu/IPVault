/* eslint-disable @typescript-eslint/no-require-imports */
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("WebpageStorageModule", (m) => {
  const webpageStorage = m.contract("WebpageStorage");

  return { webpageStorage };
});