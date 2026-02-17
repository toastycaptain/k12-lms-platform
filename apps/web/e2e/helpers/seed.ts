import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const coreDir = path.resolve(__dirname, "../../../core");

export const E2E_FIXTURES = {
  tenantSlug: "e2e-district",
  courseName: "E2E Biology 101",
  adminEmail: "admin@e2e.local",
  teacherEmail: "teacher@e2e.local",
  studentEmail: "student@e2e.local",
};

async function runRailsTask(taskName: string): Promise<void> {
  const result = await execFileAsync("bundle", ["exec", "rails", taskName], {
    cwd: coreDir,
    env: {
      ...process.env,
      RAILS_ENV: process.env.RAILS_ENV || "test",
      ENABLE_E2E_TEST_HELPERS: "true",
    },
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

export async function seedTestData(): Promise<void> {
  await runRailsTask("e2e:seed");
}

export async function cleanupTestData(): Promise<void> {
  await runRailsTask("e2e:cleanup");
}
