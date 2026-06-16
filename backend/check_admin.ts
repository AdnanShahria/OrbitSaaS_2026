import { createClient } from '@libsql/client';

const client = createClient({
  url: "libsql://orbitsaasportfolio-adnanshahria19.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzEwMDQ0OTMsImlkIjoiNzUyNzNlYWQtNDkzMy00MWZjLWIyOWYtNDA0OWFiYzZjOGY1IiwicmlkIjoiNTRkNTc2MDAtZmUzMy00NGZlLWJkN2EtNzg0YWUxMmQwMDExIn0.UEhVL3SNwBfugL8UOVJRpRiSOyFcLFWSvAWIrBgQJ0clajL0jF-BhQa7zMCjEPETC2TY7ItkCGfbkklMMQw1Cg",
});

async function main() {
  try {
    const rs = await client.execute("SELECT * FROM admin_users");
    console.log(rs.rows);
  } catch (err) {
    console.error("Error querying db:", err);
  }
}

main();
