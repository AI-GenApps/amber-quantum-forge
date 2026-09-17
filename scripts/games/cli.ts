import { detectAffected } from "./affected";
import { buildGame } from "./cli-build";
import { analyze, bootstrap, doctor, format, list, test, validate } from "./cli-commands";
import { runGame } from "./cli-device";
import { generateRegistry } from "./codegen";
import { parseEnvironment, writeGameConfigs } from "./config";
import { validateContent } from "./content";
import { generateGame, validateGenerated } from "./generate";
import { writeBuildMetadata } from "./metadata";
import { prepareNativeProjects } from "./native";
import { flag, requireApp } from "./toolchain";
import { generateXcodeProjects } from "./xcodegen";

export type { PhysicalDeviceStatus } from "./cli-device";
export { classifyPhysicalDevice } from "./cli-device";

function generated(args: string[]): void {
  const output = flag(args, "--output") ?? args[0];
  if (!output) throw new Error("Generated app path is required");
  const errors = validateGenerated(output);
  if (errors.length > 0) throw new Error(errors.join("\n"));
  console.log(`Generated app validation passed: ${output}`);
}

function help(): void {
  console.log(
    "games commands: bootstrap, doctor, list, format, analyze, test, validate, content, run, build, affected, generate, validate-generated, config, native, xcodegen, metadata, codegen",
  );
  console.log(
    "Use --app <stable_id> for a selected game; run requires --device-id <physical_device>.",
  );
}

function main(args: string[]): void {
  const [command, ...rest] = args;
  switch (command) {
    case "bootstrap":
      bootstrap();
      break;
    case "doctor":
      doctor(rest);
      break;
    case "list":
      list();
      break;
    case "format":
      format(rest);
      break;
    case "analyze":
      analyze(rest);
      break;
    case "test":
      test(rest);
      break;
    case "validate":
      validate(rest);
      break;
    case "content":
      if (rest[0] !== "validate") throw new Error("Use games content validate");
      {
        const errors = validateContent();
        if (errors.length > 0) throw new Error(errors.join("\n"));
      }
      console.log("Content validation passed.");
      break;
    case "run":
      runGame(rest);
      break;
    case "build":
      {
        const app = rest.includes("--app") ? requireApp(flag(rest, "--app")) : undefined;
        if (!app) throw new Error("--app is required for games:build");
        buildGame(rest, app);
      }
      break;
    case "affected":
      console.log(JSON.stringify(detectAffected(flag(rest, "--base") ?? "origin/main"), null, 2));
      break;
    case "generate":
      generateGame({
        id: flag(rest, "--id") ?? "",
        title: flag(rest, "--title") ?? "",
        output: flag(rest, "--output") ?? "",
      });
      break;
    case "validate-generated":
      generated(rest);
      break;
    case "codegen":
      writeGameConfigs(parseEnvironment(flag(rest, "--environment") ?? "debug"));
      generateRegistry();
      break;
    case "native":
      prepareNativeProjects();
      break;
    case "xcodegen":
      generateXcodeProjects(rest.includes("--app") ? requireApp(flag(rest, "--app")) : undefined);
      break;
    case "metadata":
      console.log(`Wrote build metadata to ${writeBuildMetadata(rest)}`);
      break;
    case "config":
      console.log(
        `Generated ${writeGameConfigs(parseEnvironment(flag(rest, "--environment") ?? "debug")).length} app configs.`,
      );
      break;
    default:
      help();
  }
}

if (import.meta.main) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
