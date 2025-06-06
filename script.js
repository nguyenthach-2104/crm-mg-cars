let gapiInited = false;
let currentUserEmail = null;

function onLoad() {
    gapi.load('client', initializeGapiClient);
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

async function handleLogin() {
    if (!gapiInited) {
        alert('Hệ thống chưa sẵn sàng. Vui lòng chờ vài giây và thử lại.');
        return;
    }

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Vui lòng điền email và mật khẩu.');
        return;
    }

    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'Users!A2:G',
        });
        const users = response.result.values || [];
        const user = users.find(row => row[2] === email && row[3] === password);

        if (user) {
            const [id, name, userEmail, userPassword, role, group, status] = user;
            if (status !== 'Hoạt động') {
                alert('Tài khoản không hoạt động. Vui lòng liên hệ quản trị viên.');
                return;
            }
            currentUserEmail = email;
            document.getElementById('auth').style.display = 'none';
            document.getElementById('main').style.display = 'block';
            document.getElementById('userName').innerText = name;
            document.getElementById('userRole').innerText = role;
            if (role === 'Quản trị viên') {
                document.getElementById('adminPanel').style.display = 'block';
                loadGroups();
            }
        } else {
            alert('Email hoặc mật khẩu không đúng.');
        }
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        alert('Lỗi khi đăng nhập. Vui lòng thử lại.');
    }
}

function logout() {
    currentUserEmail = null;
    document.getElementById('auth').style.display = 'block';
    document.getElementById('main').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

async function createUser() {
    alert('Chức năng tạo người dùng tạm thời bị vô hiệu hóa vì không thể ghi dữ liệu trong phiên bản này. Vui lòng thêm người dùng trực tiếp vào Google Sheets.');
}

async function createGroup() {
    alert('Chức năng tạo nhóm tạm thời bị vô hiệu hóa vì không thể ghi dữ liệu trong phiên bản này. Vui lòng thêm nhóm trực tiếp vào Google Sheets.');
}

async function loadGroups() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'Groups!A2:E',
        });
        const groups = response.result.values || [];
        const groupList = document.getElementById('groupList');
        groupList.innerHTML = '<h4>Danh Sách Nhóm</h4>';
        if (groups.length === 0) {
            groupList.innerHTML += '<p>Chưa có nhóm nào.</p>';
            return;
        }
        groups.forEach(group => {
            const [id, name, leader, deputy, status] = group;
            groupList.innerHTML += `<p>Nhóm: ${name} | Trưởng nhóm: ${leader} | Phó nhóm: ${deputy || 'Không có'} | Trạng thái: ${status}</p>`;
        });
    } catch (error) {
        console.error('Lỗi khi tải danh sách nhóm:', error);
    }
}

window.onload = onLoad;