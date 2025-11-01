import { app, shell, BrowserWindow, ipcMain, powerMonitor } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import axios from '../renderer/src/config/AxiosConfig'
import { get } from 'http';
import { notDeepEqual } from 'assert';
import {autoUpdater} from 'electron-updater';
import { cwd } from 'process';


let remindInterval = null; // for repeating reminders



let emp_id = null; // Variable to Store emp_id (set by renderer via IPC)
let mainWindow = null; // Store the mainWindow reference
let isLocked = false; // Track screen lock state
let isQuitting = false; // Guard to avoid duplicate cleanup
let imgPath = join(process.cwd(),'resourses', 'icon.ico')
console.log(imgPath, 'ko');
function getLocalIPv4(){
  const interfaces = require('os').networkInterfaces()
  for (const name of Object.keys(interfaces)){
    for (const iface of interfaces[name]){
      if (iface.family ==='IPv4' && !iface.internal){
        return iface.address
      }
    } 
  }
  return 'unknown'
}


function endConnection(){
  if (!emp_id){
    console.log('endConnection: no emp_id, skipping');
    return Promise.resolve()
  }
  const ip = getLocalIPv4()
  const url = `http://localhost:5000/auth/logend-connection/${emp_id}?ip=${encodeURIComponent(ip)}`

  return axios.post(url)
              .then(()=>console.log('user marked as inactive (IP:', ip,')'))
              .catch((err)=>{
                console.log(err);
              })
}


function notifyActiveFromMain(){
  if(!emp_id){
    console.log('notifyActiveFromMain: no emp_id, skipping server ping');
    return Promise.resolve()
  }

  const ip = getLocalIPv4()
  const url = `http://localhost:5000/auth/logactive-users/${emp_id}?ip=${encodeURIComponent(ip)}`

  return axios.get(url)
              .then(()=>console.log('Server: user marked active (from main) (IP:', ip, ')'))
              .catch((err)=>{
                console.error('notifyActiveFromMain error:', err?.message || err)
              })
}

function notifyWake() {
  if (mainWindow) {
    const payload = {
      empId: emp_id,
      ip: emp_id ? getLocalIPv4() : undefined,
      version: app.getVersion() 
    }
    try {
      mainWindow.webContents.send('screen-unlock', payload)
      console.log('main -> renderer screen-unlock sent', payload)
    } catch (err) {
      console.error('Failed to send screen-unlock to renderer', err)
    }
  }
}


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    icon: imgPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}



// const showNotification = (title, body, actions = []) => {
//   const notification = new Notification({
//     title,
//     body,
//     actions,
//     silent: false,
//     closeButtonText: 'Close',
//   });

//   notification.show();
//   return notification;
// };

// --- PROMPT USER TO INSTALL ---

// const promptInstallNowOrLater = () => {
//   const notification = showNotification('Update Ready', 'A new version has been downloaded.', [
//     { type: 'button', text: 'Install Now' },
//     { type: 'button', text: 'Later' },
//   ]);

//   notification.once('action', (_event, index) => {
//     if (index === 0) {
//       log.info('User chose to install now.');
//       clearInterval(remindInterval);
//       autoUpdater.quitAndInstall();
//     } else {
//       log.info('User postponed update.');
//       remindUserLater();
//     }
//   });

//   notification.once('close', () => {
//     log.info('Notification closed by user.');
//   });
// };

// // --- REMIND USER EVERY 2 MINUTES ---
// const remindUserLater = () => {
//   if (remindInterval) clearInterval(remindInterval);
//   remindInterval = setInterval(() => {
//     const n = showNotification('Reminder', 'An update is ready to install. Restart now?', [
//       { type: 'button', text: 'Install Now' },
//       { type: 'button', text: 'Later' },
//     ]);

//     n.once('action', (_event, index) => {
//       if (index === 0) {
//         clearInterval(remindInterval);
//         autoUpdater.quitAndInstall();
//       }
//     });
//   }, 2 * 60 * 1000); // every 2 minutes
// };

// // --- AUTO UPDATER EVENTS ---
// autoUpdater.on('checking-for-update', () => {
//   log.info('Checking for updates...');
// });

// autoUpdater.on('update-available', (info) => {
//   log.info(`Update available: v${info.version}`);
//   showNotification('Update Available', `Version ${info.version} is downloading...`);
// });

// autoUpdater.on('update-not-available', () => {
//   log.info('No updates available.');
//   showNotification('Up to Date', 'You are running the latest version.');
// });


// autoUpdater.on('error', (err) => {
//   log.error('Update error:', err);
//   showNotification('Update Error', err.message || 'Something went wrong while updating.');
// });


// autoUpdater.on('download-progress', (progressObj) => {
//   const percent = progressObj.percent.toFixed(1);
//   log.info(`Download progress: ${percent}%`);
// });


// autoUpdater.on('update-downloaded', (info) => {
//   log.info(`Update downloaded: v${info.version}`);
//   promptInstallNowOrLater();
// });



function setupAutoUpdater() {
  if (!app.isPackaged) return // Only run in production builds
 
  autoUpdater.autoDownload = true
 
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...')
  })
 
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version)
 
    // Show desktop notification
    const notif = new Notification({
      title: 'Update Available 🚀',
      body: `Version ${info.version} is downloading in the background...`,
      silent: false
    })
    notif.show()
 
    mainWindow.webContents.send('check-update', info.version)
  })
 
  autoUpdater.on('update-not-available', () => {
    console.log('No update available')
  })
 
  autoUpdater.on('error', (err) => {
    console.error('Update error:', err)
    new Notification({
      title: 'Update Error ❌',
      body: err.message || 'Failed to check for updates.'
    }).show()
  })
 
  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent)
    console.log(`Downloading update... ${percent}%`)
    mainWindow.setProgressBar(progress.percent / 100)
  })
 
  autoUpdater.on('update-downloaded', (info) => {
    console.log(`Update downloaded: ${info.version}`)
 
    // Use a styled dialog for install confirmation
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Install Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update Ready 🎉',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'Would you like to install the update now? Your app will restart.'
    })
 
    if (choice === 0) {
      console.log('User chose to install update now')
      autoUpdater.quitAndInstall()
    } else {
      console.log('User chose to install later')
      new Notification({
        title: 'Update Deferred ⏰',
        body: 'You can install the update later from Settings or next restart.'
      }).show()
 
      // Optional: remind again in 30 mins
      setTimeout(
        () => {
          const reminder = new Notification({
            title: 'Reminder 🔔',
            body: 'An update is ready to install. Click to update now!'
          })
 
          reminder.show()
 
          reminder.on('click', () => {
            console.log('User clicked the update reminder notification')
 
            // Option 1: install immediately
            // autoUpdater.quitAndInstall()
 
            // Option 2: show a confirmation first (safer)
            const choice = dialog.showMessageBoxSync(mainWindow, {
              type: 'question',
              buttons: ['Install Now', 'Cancel'],
              defaultId: 0,
              cancelId: 1,
              title: 'Install Update',
              message: 'Would you like to install the downloaded update now?'
            })
            if (choice === 0) {
              autoUpdater.quitAndInstall()
            }
          })
        },
        30 * 60 * 1000
      )
    }
  })
 
  // Start the update check
  autoUpdater.checkForUpdatesAndNotify()
}


app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-app-version', () => app.getVersion())

  // powerMonitor.on('lock-screen',()=>{
  //   console.log('Power Monitor: Lock Screen Fired');
  //   isLocked = true;
    
  //   endConnection()

  //   if (mainWindow){
  //     const ip = getLocalIPv4();
  //     mainWindow.webContents.send('screen-lock',{empId: emp_id, ip})
  //   }
  // })

  // powerMonitor.on('suspend', ()=>{
  //   console.log('Power Monitor Suspend Fired');
  //   isLocked = true;
  //   endConnection();

  //   if (mainWindow){
  //     const ip = getLocalIPv4()
  //     mainWindow.webContents.send('screen-lock', {empId: emp_id, id})
  //   }
  // })

  powerMonitor.on('unlock-screen', async ()=>{
    console.log('powerMonitor: unlock-screen fired');

    try{
      await notifyActiveFromMain()
    }catch(err){
      console.log('notifyActiveFromMain threw',err);
    }
    notifyWake();
    isLocked= false
  })

  // powerMonitor.on('resume', async () => {
  //   console.log('powerMonitor: resume fired')
  //   try {
  //     await notifyActiveFromMain()
  //   } catch (err) {
  //     console.error('notifyActiveFromMain threw on resume:', err)
  //   }
  //   notifyWake()
  //   isLocked = false
  // })



  createWindow()

  // Check for updates after 5 seconds
  // setTimeout(() => {
  //   autoUpdater.checkForUpdatesAndNotify();
  // }, 5000);
  setupAutoUpdater()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
