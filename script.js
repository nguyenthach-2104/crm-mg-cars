let gapiInited = false;
let gisInited = false;

function onLoad() {
    gapi.load('client', initializeGapiClient);
    gapi.load('auth2', initializeGisClient);
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: CONFIG.apiKey,
            discoveryDocs: CONFIG.discoveryDocs,
        });
        gapiInited = true;
        console.log('GAPI client khởi tạo thành công');
    } catch (error) {
        console.error('Lỗi khởi tạo GAPI client:', error);
    }
}

function initializeGisClient() {
    try {
        gapi.auth2.init({
            client_id: CONFIG.clientId,
            scope: CONFIG.scope
        });
        gisInited = true;
        console.log('GIS client khởi tạo thành công');
    } catch (error) {
        console.error('Lỗi khởi tạo GIS client:', error);
    }
}

function handleAuthClick() {
    if (gapiInited && gisInited) {
        gapi.auth2.getAuthInstance().signIn().then(() => {
            document.getElementById('auth').style.display = 'none';
            document.getElementById('main').style.display = 'block';
            loadUserData();
        }).catch(error => {
            console.error('Lỗi đăng nhập:', error);
            alert('Đăng nhập thất bại. Vui lòng thử lại.');
        });
    } else {
        alert('Hệ thống chưa sẵn sàng. Vui lòng chờ vài giây và thử lại.');
    }
}

async function loadUserData() {
    const user = gapi.auth2.getAuthInstance().currentUser.get();
    const profile = user.getBasicProfile();
    const email = profile.getEmail();
    document.getElementById('userName').innerText = profile.getName();

    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'Users!A2:E',
        });
        const users = response.result.values || [];
        const currentUser = users.find(row => row[2] === email);
        if (currentUser) {
            const role = currentUser[3];
            document.getElementById('userRole').innerText = role;
            if (role === 'Quản trị viên') {
                document.getElementById('adminPanel').style.display = 'block';
            }
        } else {
            alert('Không tìm thấy người dùng. Vui lòng liên hệ quản trị viên để thêm tài khoản.');
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu người dùng:', error);
        alert('Lỗi khi tải dữ liệu. Vui lòng thử lại.');
    }
}

async function createUser() {
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const role = document.getElementById('newUserRole').value;
    const group = document.getElementById('newUserGroup').value;
    const id = Date.now().toString(); // ID tạm thời dựa trên thời gian

    if (!name || !email || !role || !group) {
        alert('Vui lòng điền đầy đủ thông tin.');
        return;
    }

    try {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'Users!A2:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[id, name, email, 'password123', role, group, 'Hoạt động']]
            }
        });
        alert('Tạo người dùng thành công!');
        document.getElementById('newUserName').value = '';
        document.getElementById('newUserEmail').value = '';
        document.getElementById('newUserGroup').value = '';
    } catch (error) {
        console.error('Lỗi khi tạo người dùng:', error);
        alert('Lỗi khi tạo người dùng. Vui lòng thử lại.');
    }
}

window.onload = onLoad;