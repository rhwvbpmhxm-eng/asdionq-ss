// 记账程序脚本

// 初始化日期为今天
window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始加载数据
    updateAllStats();
};

// 绑定事件监听器
function bindEventListeners() {
    // 表单提交事件
    document.getElementById('accountingForm').addEventListener('submit', handleFormSubmit);
    
    // 标签页切换事件
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', handleTabChange);
    });
    
    // 数据管理事件
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importFile').addEventListener('change', handleFileImport);
    document.getElementById('clearBtn').addEventListener('click', clearData);
}

// 处理表单提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const record = {
        id: Date.now(), // 使用时间戳作为唯一ID
        type: document.getElementById('type').value,
        date: document.getElementById('date').value,
        content: document.getElementById('content').value,
        method: document.getElementById('method').value,
        amount: parseFloat(document.getElementById('amount').value),
        timestamp: new Date().getTime()
    };
    
    // 保存到本地存储
    saveRecord(record);
    
    // 清空表单
    e.target.reset();
    
    // 重置日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // 更新统计数据
    updateAllStats();
    
    // 显示成功提示（可选）
    alert('记录保存成功！');
}

// 保存记录到本地存储
function saveRecord(record) {
    let records = JSON.parse(localStorage.getItem('accountingRecords')) || [];
    records.push(record);
    localStorage.setItem('accountingRecords', JSON.stringify(records));
}

// 获取所有记录
function getAllRecords() {
    return JSON.parse(localStorage.getItem('accountingRecords')) || [];
}

// 按时间范围筛选记录
function getRecordsByPeriod(period) {
    const allRecords = getAllRecords();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    return allRecords.filter(record => {
        const recordDate = new Date(record.date);
        const recordYear = recordDate.getFullYear();
        const recordMonth = recordDate.getMonth() + 1;
        
        switch(period) {
            case 'month':
                return recordYear === year && recordMonth === month;
            case 'year':
                return recordYear === year;
            case 'all':
                return true;
            default:
                return true;
        }
    }).sort((a, b) => b.timestamp - a.timestamp); // 按时间倒序排列
}

// 计算统计数据
function calculateStats(records) {
    let income = 0;
    let expense = 0;
    
    records.forEach(record => {
        // 结余属于收入类型，其他属于支出类型
        if (record.type === '结余') {
            income += record.amount;
        } else {
            expense += record.amount;
        }
    });
    
    return {
        income: income,
        expense: expense,
        balance: income - expense
    };
}

// 更新统计面板
function updateStatsPanel(period) {
    const records = getRecordsByPeriod(period);
    const stats = calculateStats(records);
    
    // 更新统计数值
    document.getElementById(`${period}-income`).textContent = `¥${stats.income.toFixed(2)}`;
    document.getElementById(`${period}-expense`).textContent = `¥${stats.expense.toFixed(2)}`;
    document.getElementById(`${period}-balance`).textContent = `¥${stats.balance.toFixed(2)}`;
    
    // 更新记录列表
    updateRecordsList(records, `${period}-records`);
}

// 更新所有统计面板
function updateAllStats() {
    updateStatsPanel('month');
    updateStatsPanel('year');
    updateStatsPanel('all');
}

// 更新记录列表
function updateRecordsList(records, containerId) {
    const container = document.getElementById(containerId);
    
    if (records.length === 0) {
        container.innerHTML = '<div class="empty-records">暂无记录</div>';
        return;
    }
    
    // 生成记录HTML
    const recordsHTML = records.map(record => {
        return `
            <div class="record-item">
                <div class="record-info">
                    <div class="record-content">${record.content}</div>
                    <div class="record-meta">
                        <span>${record.date}</span>
                        <span>${record.method}</span>
                        <span>${record.type}</span>
                    </div>
                </div>
                <div class="record-amount ${record.type === '结余' ? 'income' : 'expense'}">
                    ${record.type === '结余' ? '+' : '-' }¥${record.amount.toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = recordsHTML;
}

// 处理标签页切换
function handleTabChange(e) {
    // 移除所有标签页的active类
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 移除所有面板的active类
    document.querySelectorAll('.stats-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // 添加当前标签页和面板的active类
    const period = e.target.dataset.period;
    e.target.classList.add('active');
    document.getElementById(`${period}-stats`).classList.add('active');
}

// 辅助函数：格式化金额
function formatAmount(amount) {
    return `¥${amount.toFixed(2)}`;
}

// 辅助函数：获取当前月份的第一天
function getFirstDayOfMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

// 辅助函数：获取当前年份的第一天
function getFirstDayOfYear() {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
}

// 导出数据功能
function exportData() {
    const records = getAllRecords();
    const dataStr = JSON.stringify(records, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    const now = new Date().toISOString().split('T')[0];
    link.download = `accounting_records_${now}.json`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('数据导出成功！');
}

// 处理文件导入
function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            importData(importedData);
        } catch (error) {
            alert('数据格式错误，请选择正确的JSON文件！');
        }
    };
    reader.readAsText(file);
    
    // 重置文件输入
    e.target.value = '';
}

// 导入数据功能
function importData(importedData) {
    if (!Array.isArray(importedData)) {
        alert('数据格式错误，请选择正确的JSON文件！');
        return;
    }
    
    // 确认导入操作
    if (!confirm('确定要导入数据吗？当前数据将被覆盖！')) {
        return;
    }
    
    // 保存导入的数据
    localStorage.setItem('accountingRecords', JSON.stringify(importedData));
    
    // 更新统计
    updateAllStats();
    
    alert('数据导入成功！');
}

// 清空数据功能
function clearData() {
    // 确认清空操作
    if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        return;
    }
    
    // 清空本地存储
    localStorage.removeItem('accountingRecords');
    
    // 更新统计
    updateAllStats();
    
    alert('数据清空成功！');
}