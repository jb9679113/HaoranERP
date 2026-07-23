import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * 导出库存盘点表
 * @param {Array} products - 商品列表
 * @param {Array} purchases - 采购记录
 * @param {Array} sales - 销售记录
 * @param {Array} giftIssues - 赠品出库记录
 */
export const exportInventoryReport = async (products, purchases, sales, giftIssues) => {
  try {
    // Sheet 1: 商品库存汇总
    const productSheet = products.map((p, index) => ({
      '序号': index + 1,
      '商品名称': p.name || '',
      '品牌': p.brand || '',
      '规格': p.spec || '',
      'SKU': p.sku || '',
      '当前库存': p.stock_quantity || 0,
      '进货价': p.purchase_price || 0,
      '售价': p.selling_price || 0,
      '库存金额': (p.stock_quantity || 0) * (p.purchase_price || 0),
      '供应商': p.supplier || '',
      '创建时间': p.created_at || '',
    }));

    // Sheet 2: 进出库明细
    const detailsSheet = [];
    
    // 添加采购记录
    purchases.forEach(p => {
      detailsSheet.push({
        '序号': detailsSheet.length + 1,
        '日期': p.purchase_date || '',
        '明细': `采购入库（${p.supplier || ''}）`,
        '入库数量': p.quantity || 0,
        '入库单价': p.unit_price || 0,
        '入库金额': (p.quantity || 0) * (p.unit_price || 0),
        '出库数量': '',
        '出库单价': '',
        '出库金额': '',
        '备注': p.products?.name || p.description || '',
      });
    });
    
    // 添加销售记录
    sales.forEach(s => {
      detailsSheet.push({
        '序号': detailsSheet.length + 1,
        '日期': s.sale_date || '',
        '明细': `销售出库（${s.customers?.name || ''}）`,
        '入库数量': '',
        '入库单价': '',
        '入库金额': '',
        '出库数量': s.quantity || 0,
        '出库单价': s.unit_price || 0,
        '出库金额': (s.quantity || 0) * (s.unit_price || 0),
        '销售员': s.employees?.name || '',
        '备注': s.products?.name || '',
      });
    });
    
    // 添加赠品出库记录
    giftIssues.forEach(g => {
      detailsSheet.push({
        '序号': detailsSheet.length + 1,
        '日期': g.issue_date || '',
        '明细': `赠送出库（${g.customers?.name || ''}）`,
        '入库数量': '',
        '入库单价': '',
        '入库金额': '',
        '出库数量': g.quantity || 0,
        '出库单价': g.unit_cost || 0,
        '出库金额': g.total_cost || 0,
        '备注': g.description || g.issue_types?.name || '',
      });
    });
    
    // 按日期排序
    detailsSheet.sort((a, b) => {
      const dateA = a.日期 ? new Date(a.日期) : new Date(0);
      const dateB = b.日期 ? new Date(b.日期) : new Date(0);
      return dateA - dateB;
    });

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 添加Sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productSheet), '商品库存汇总');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailsSheet), '进出库明细');

    // 导出文件
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `库存盘点表_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('导出库存盘点表失败:', error);
    throw error;
  }
};

/**
 * 导出财务报表
 * @param {Object} report - 核心指标
 * @param {Array} sales - 销售明细
 * @param {Array} purchases - 采购明细
 * @param {Array} transactions - 经营流水明细
 * @param {Array} giftIssues - 赠品出库明细
 * @param {string} period - 统计周期
 */
export const exportFinancialReport = async (report, sales, purchases, transactions, giftIssues, period) => {
  try {
    const periodLabels = {
      month: '本月',
      quarter: '本季度',
      year: '本年度'
    };
    
    // Sheet 1: 核心指标（专业财务报表格式）
    const summarySheet = [
      // 表头信息
      { '': '', '山青浩然羽毛球管理系统': '', '': '' },
      { '': '', '财务报表': '', '' },
      { '': '', `统计周期：${periodLabels[period] || ''}`: '', '' },
      { '': '', `生成时间：${new Date().toLocaleString('zh-CN')}`: '', '' },
      { '': '', '', '' },
      
      // 资产部分
      { '类别': '资产', '项目': '银行账户余额', '金额': report.accountBalance || 0, '备注': '青岛银行账户' },
      { '类别': '', '项目': '', '金额': '', '备注': '' },
      
      // 收入部分
      { '类别': '收入', '项目': '销售总额', '金额': report.totalSales || 0, '备注': '' },
      { '类别': '', '项目': '经营流水收入', '金额': report.transactionIncome || 0, '备注': '入账、收入' },
      { '类别': '', '项目': '总收入', '金额': report.totalIncome || 0, '备注': '销售总额 + 经营流水收入' },
      { '类别': '', '项目': '', '金额': '', '备注': '' },
      
      // 支出部分
      { '类别': '支出', '项目': '采购总额', '金额': report.totalPurchases || 0, '备注': '' },
      { '类别': '', '项目': '经营流水支出', '金额': report.transactionExpense || 0, '备注': '付款、支出、报销' },
      { '类别': '', '项目': '赠品出库成本', '金额': report.giftIssueCost || 0, '备注': '市场推广/业务招待/样品赠送' },
      { '类别': '', '项目': '总支出', '金额': report.totalExpense || 0, '备注': '采购总额 + 经营流水支出 + 赠品出库成本' },
      { '类别': '', '项目': '', '金额': '', '备注': '' },
      
      // 利润部分
      { '类别': '利润', '项目': '整体利润', '金额': report.overallProfit || 0, '备注': '总收入 - 总支出' },
      { '类别': '', '项目': '初始资金', '金额': report.bankBalance || 0, '备注': '5人 × 10,000 = 50,000' },
      { '类别': '', '项目': '上期余额', '金额': report.previousBalance || 0, '备注': '初始资金 + 历史累计' },
      { '类别': '', '项目': '当前账户余额', '金额': report.accountBalance || 0, '备注': '上期余额 + 本期利润' },
    ];

    // Sheet 2: 收支对比摘要
    const comparisonSheet = [
      { '类别': '', '项目': periodLabels[period] || '', '金额': '', '占比': '' },
      { '类别': '', '': '', '', '' },
      { '类别': '收入', '项目': '销售总额', '金额': report.totalSales || 0, '占比': report.totalIncome ? ((report.totalSales || 0) / report.totalIncome * 100).toFixed(1) + '%' : '' },
      { '类别': '收入', '项目': '经营流水收入', '金额': report.transactionIncome || 0, '占比': report.totalIncome ? ((report.transactionIncome || 0) / report.totalIncome * 100).toFixed(1) + '%' : '' },
      { '类别': '收入', '项目': '收入合计', '金额': report.totalIncome || 0, '占比': '100%' },
      { '类别': '', '项目': '', '金额': '', '占比': '' },
      { '类别': '支出', '项目': '采购总额', '金额': report.totalPurchases || 0, '占比': report.totalExpense ? ((report.totalPurchases || 0) / report.totalExpense * 100).toFixed(1) + '%' : '' },
      { '类别': '支出', '项目': '经营流水支出', '金额': report.transactionExpense || 0, '占比': report.totalExpense ? ((report.transactionExpense || 0) / report.totalExpense * 100).toFixed(1) + '%' : '' },
      { '类别': '支出', '项目': '赠品出库成本', '金额': report.giftIssueCost || 0, '占比': report.totalExpense ? ((report.giftIssueCost || 0) / report.totalExpense * 100).toFixed(1) + '%' : '' },
      { '类别': '支出', '项目': '支出合计', '金额': report.totalExpense || 0, '占比': '100%' },
      { '类别': '', '项目': '', '金额': '', '占比': '' },
      { '类别': '利润', '项目': '整体利润', '金额': report.overallProfit || 0, '占比': '' },
      { '类别': '', '项目': '利润率', '金额': report.totalIncome ? ((report.overallProfit || 0) / report.totalIncome * 100).toFixed(1) + '%' : '', '占比': '' },
    ];

    // Sheet 3: 数据分析（数据透视表数据源）
    const analysisSheet = [
      { '类别': '收入', '项目': '销售总额', '金额': report.totalSales || 0, '周期': periodLabels[period] },
      { '类别': '收入', '项目': '经营流水收入', '金额': report.transactionIncome || 0, '周期': periodLabels[period] },
      { '类别': '支出', '项目': '采购总额', '金额': report.totalPurchases || 0, '周期': periodLabels[period] },
      { '类别': '支出', '项目': '经营流水支出', '金额': report.transactionExpense || 0, '周期': periodLabels[period] },
      { '类别': '支出', '项目': '赠品出库成本', '金额': report.giftIssueCost || 0, '周期': periodLabels[period] },
      { '类别': '利润', '项目': '整体利润', '金额': report.overallProfit || 0, '周期': periodLabels[period] },
      { '类别': '资产', '项目': '账户余额', '金额': report.accountBalance || 0, '周期': periodLabels[period] },
    ];

    // Sheet 4: 销售明细
    const salesSheet = sales.map((s, index) => ({
      '序号': index + 1,
      '日期': s.sale_date || '',
      '商品名称': s.products?.name || '未知',
      '客户': s.customers?.name || '',
      '数量': s.quantity || 0,
      '单价': s.unit_price || 0,
      '金额': (s.quantity || 0) * (s.unit_price || 0),
      '销售员': s.employees?.name || '',
    }));

    // Sheet 5: 采购明细
    const purchasesSheet = purchases.map((p, index) => ({
      '序号': index + 1,
      '日期': p.purchase_date || '',
      '商品名称': p.products?.name || '未知',
      '供应商': p.supplier || '',
      '数量': p.quantity || 0,
      '单价': p.unit_price || 0,
      '金额': (p.quantity || 0) * (p.unit_price || 0),
    }));

    // Sheet 6: 经营流水明细
    const transactionsSheet = transactions.map((t, index) => ({
      '序号': index + 1,
      '日期': t.transaction_date || '',
      '类型': t.type || '',
      '科目': t.expense_categories?.name || '',
      '金额': t.amount || 0,
      '描述': t.description || '',
      '付款方式': '',
    }));

    // Sheet 7: 赠品出库成本
    const giftIssuesSheet = giftIssues.map((g, index) => ({
      '序号': index + 1,
      '日期': g.issue_date || '',
      '商品名称': g.products?.name || '未知',
      '客户': g.customers?.name || '',
      '数量': g.quantity || 0,
      '成本': g.unit_cost || 0,
      '费用科目': g.issue_types?.expense_account || '',
      '类型': g.issue_types?.name || '',
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 添加Sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summarySheet), '核心指标');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(comparisonSheet), '收支对比');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysisSheet), '数据分析');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesSheet), '销售明细');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchasesSheet), '采购明细');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactionsSheet), '经营流水');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(giftIssuesSheet), '赠品出库');

    // 导出文件
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `财务报表_${periodLabels[period]}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('导出财务报表失败:', error);
    throw error;
  }
};

/**
 * 导出赠品出库记录
 * @param {Array} giftIssues - 赠品出库记录
 */
export const exportGiftIssues = async (giftIssues) => {
  try {
    const sheetData = giftIssues.map((g, index) => ({
      '序号': index + 1,
      '日期': g.issue_date || '',
      '商品名称': g.products?.name || '未知',
      '客户': g.customers?.name || '',
      '出库类型': g.issue_types?.name || '',
      '费用科目': g.issue_types?.expense_account || '',
      '数量': g.quantity || 0,
      '成本单价': g.unit_cost || 0,
      '总成本': g.total_cost || 0,
      '备注': g.description || '',
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetData), '赠品出库记录');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `赠品出库记录_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('导出赠品出库记录失败:', error);
    throw error;
  }
};