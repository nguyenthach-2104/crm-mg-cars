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

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    if (!currentPassword || !newPassword) {
        alert('Vui lòng điền mật khẩu hiện tại và mật khẩu mới.');
        return;
    }

    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'Users!A2:G',
        });
        const users = response.result.values || [];
        const userIndex = users.findIndex(row => row[2] === currentUserEmail);

        if (userIndex === -1) {
            alert('Không tìm thấy người dùng.');
            return;
        }

        const user = users[userIndex];
        if (user[3] !== currentPassword) {
            alert('Mật khẩu hiện tại không đúng.');
            return;
        }

        users[userIndex][3] = newPassword;

        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CONFIG.spreadsheetId,
            range: `Users!A${userIndex + 2}:G${userIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [users[userIndex]]
            }
        });

        alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        logout();
    } catch (error) {
        console.error('Lỗi khi đổi mật khẩu:', error);
        alert('Lỗi khi đổi mật khẩu. Vui lòng thử lại.');
    }
}

async function createUser() {
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    const group = document.getElementById('newUserGroup').value;
    const id = Date.now().toString();

    if (!name || !email || !password || !role || !group) {
        alert('Vui lòng điền đầy đủ thông tin.');
        return;
    }

    try {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'Users!A2:G',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[id, name, email, password, role, group, 'Hoạt động']]
            }
        });
        alert('Tạo người dùng thành công!');
        document.getElementById('newUserName').value = '';
        document.getElementById('newUserEmail').value = '';
        document.getElementById('newUserPassword').value = '';
        document.getElementById('newUserGroup').value = '';
    } catch (error) {
        console.error('Lỗi khi tạo người dùng:', error);
        alert('Lỗi khi tạo người dùng. Vui lòng thử lại.');
    }
}

async function createGroup() {
    const groupName = document.getElementById('newGroupName').value;
    const leaderEmail = document.getElementById('newGroupLeader').value;
    const deputyEmail = document.getElementById('newGroupDeputy').value;
    const groupId = Date.now().toString();

    if (!groupName || !leaderEmail) {
        alert('Vui lòng điền đầy đủ tên nhóm và email trưởng nhóm.');
        return;
    }

    try {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'Groups!A2:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[groupId, groupName, leaderEmail, deputyEmail || '', 'Hoạt động']]
            }
        });
        alert('Tạo nhóm thành công!');
        document.getElementById('newGroupName').value = '';
        document.getElementById('newGroupLeader').value = '';
        document.getElementById('newGroupDeputy').value = '';
        loadGroups();
    } catch (error) {
        console.error('Lỗi khi tạo nhóm:', error);
        alert('Lỗi khi tạo nhóm. Vui lòng thử lại.');
    }
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