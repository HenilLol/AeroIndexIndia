import { seedDevelopmentData } from "./seed";

seedDevelopmentData()
  .then(result => {
    console.log(JSON.stringify({ success: true, result }, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
