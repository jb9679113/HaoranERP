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
    
    // Sheet 1: 核心指标
    const summarySheet = [
      { '指标': '统计周期', '金额': periodLabels[period] || '', '说明': '' },
      { '指标': '总收入', '金额': report.totalIncome || 0, '说明': '销售总额 + 经营流水收入' },
      { '指标': '总支出', '金额': report.totalExpense || 0, '说明': '采购总额 + 经营流水支出 + 赠品出库成本' },
      { '指标': '整体利润', '金额': report.overallProfit || 0, '说明': '总收入 - 总支出' },
      { '指标': '上期余额', '金额': report.previousBalance || 0, '说明': '初始资金 + 历史累计利润' },
      { '指标': '账户余额', '金额': report.accountBalance || 0, '说明': '上期余额 + 本期利润' },
      { '指标': '销售总额', '金额': report.totalSales || 0, '说明': '' },
      { '指标': '采购总额', '金额': report.totalPurchases || 0, '说明': '' },
      { '指标': '经营流水收入', '金额': report.transactionIncome || 0, '说明': '' },
      { '指标': '经营流水支出', '金额': report.transactionExpense || 0, '说明': '' },
      { '指标': '赠品出库成本', '金额': report.giftIssueCost || 0, '说明': '' },
      { '指标': '生成时间', '金额': new Date().toLocaleString('zh-CN'), '说明': '' },
    ];

    // Sheet 2: 销售明细
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

    // Sheet 3: 采购明细
    const purchasesSheet = purchases.map((p, index) => ({
      '序号': index + 1,
      '日期': p.purchase_date || '',
      '商品名称': p.products?.name || '未知',
      '供应商': p.supplier || '',
      '数量': p.quantity || 0,
      '单价': p.unit_price || 0,
      '金额': (p.quantity || 0) * (p.unit_price || 0),
    }));

    // Sheet 4: 经营流水明细
    const transactionsSheet = transactions.map((t, index) => ({
      '序号': index + 1,
      '日期': t.transaction_date || '',
      '类型': t.type || '',
      '科目': t.expense_categories?.name || '',
      '金额': t.amount || 0,
      '描述': t.description || '',
      '付款方式': '',
    }));

    // Sheet 5: 赠品出库成本
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