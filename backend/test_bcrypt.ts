import bcrypt from 'bcryptjs';

async function test() {
  const hash = "$2b$10$KPVC2nvwaHg9SzG5VXJ04.vP0IRNxoSWU4mqMSQHVjyBvufJQO1IG";
  const pass = "orbit2025";
  const match = await bcrypt.compare(pass, hash);
  console.log("Match:", match);
}

test();
