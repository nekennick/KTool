const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  const logs = [];
  function log(...args) {
    const msg = args.join(' ');
    console.log(msg);
    logs.push(msg);
  }

  try {
    log('=== KTOOL FTP DEPLOY RUN ===');
    log('Timestamp:', new Date().toISOString());
    log('Connecting to:', process.env.FTP_SERVER, 'as user:', process.env.FTP_USERNAME);

    await client.access({
      host: process.env.FTP_SERVER,
      user: process.env.FTP_USERNAME,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: 'loose'
    });

    log('✅ FTP Connected successfully!');
    const pwd = await client.pwd();
    log('📍 PWD (Current Directory):', pwd);

    log('\n📋 Files before upload:');
    const listBefore = await client.list();
    listBefore.forEach(f => log(`  - [${f.isDirectory ? 'DIR' : 'FILE'}] ${f.name} (${f.size} bytes) - Mod: ${f.rawModifiedAt || f.modifiedAt}`));

    // Nếu thư mục hiện tại có public_html, cd vào public_html/ktool
    const hasPublicHtml = listBefore.some(f => f.name === 'public_html');
    if (hasPublicHtml) {
      log('ℹ️ Found public_html in current directory, navigating to public_html/ktool...');
      await client.ensureDir('public_html/ktool');
      log('📍 New PWD:', await client.pwd());
    }

    const localDir = path.join(__dirname, 'ktool');
    log('\n🚀 Uploading files from:', localDir);
    await client.uploadFromDir(localDir);

    log('\n🎉 Upload finished! Files after upload:');
    const listAfter = await client.list();
    listAfter.forEach(f => log(`  - [${f.isDirectory ? 'DIR' : 'FILE'}] ${f.name} (${f.size} bytes) - Mod: ${f.rawModifiedAt || f.modifiedAt}`));

    log('\n=== DEPLOY COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    log('❌ DEPLOY ERROR:', err.message, err.stack);
    process.exitCode = 1;
  } finally {
    client.close();
    // Ghi toàn bộ nhật ký vào file deploy_result.md để theo dõi
    fs.writeFileSync(path.join(__dirname, 'deploy_result.md'), '# FTP Deploy Log\n\n```\n' + logs.join('\n') + '\n```\n');
  }
}

deploy();
