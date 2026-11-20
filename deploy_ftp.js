const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true; // In toàn bộ nhật ký FTP chi tiết

  try {
    console.log('Connecting to FTP server:', process.env.FTP_SERVER);
    await client.access({
      host: process.env.FTP_SERVER,
      user: process.env.FTP_USERNAME,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: 'loose' // Cho phép FTPS cPanel
    });

    console.log('✅ Connected successfully!');
    const pwd = await client.pwd();
    console.log('📍 Current working directory on server:', pwd);

    console.log('📋 Listing files in current directory:');
    const list = await client.list();
    list.forEach(f => console.log('  -', f.name, '(' + f.size + ' bytes)', f.modifiedAt));

    const localDir = path.join(__dirname, 'ktool');
    console.log('🚀 Uploading all files from local:', localDir, 'to server:', pwd);
    await client.uploadFromDir(localDir);

    console.log('🎉 Upload finished! Listing files again:');
    const listAfter = await client.list();
    listAfter.forEach(f => console.log('  -', f.name, '(' + f.size + ' bytes)', f.modifiedAt));

  } catch (err) {
    console.error('❌ FTP Error:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
