module.exports = {
  apps: [
    {
      name: "4CASTER_RESEED_BOT",
      script: "npm",
      args: "run start",
      max_memory_restart: "100M",
    },
    {
      name: "ZIPPER",
      script: "npm",
      args: "run start",
      max_memory_restart: "100M",
    },
  ],
};
