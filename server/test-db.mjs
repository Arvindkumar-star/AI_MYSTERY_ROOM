import mongoose from 'mongoose';

const uri = 'mongodb+srv://shivantag2022_db_user:RnlCkWh33Wreaheb@cluster0.aw0kgof.mongodb.net/';
console.log('Testing MongoDB Atlas connection...');
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, dbName: 'ai-mystery-room' });
  console.log('SUCCESS: Connected to MongoDB Atlas!');
  await mongoose.disconnect();
  process.exit(0);
} catch(err) {
  console.error('FAILED:', err.message);
  process.exit(1);
}

