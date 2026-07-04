// Demo deck 数据：现代日本营销策略 —— 复刻 Genspark 的示例 PPT 内容
// 6 页：封面 / 市场概览 / 核心策略 / 案例 / 数据 / 行动建议
export const DEMO_DECK = {
  title: '现代日本营销策略',
  subtitle: '从「物」到「事」——体验经济下的日本品牌打法',
  palette: { primary: '#1e3a5f', accent: '#d63031', ink: '#1a1a1a', paper: '#f7f3ec', muted: '#6b7280' },
  font: 'Noto Sans SC',
  pages: [
    {
      template: 'cover',
      title: '现代日本营销策略',
      layout_desc: '封面：左侧大标题 + 副标题 + 朱红色块装饰，右下角作者/日期',
      eyebrow: 'MARKETING PLAYBOOK · 2026',
      subtitle: '从「物」到「事」——体验经济下的日本品牌打法',
      meta: 'Genspark AI Slides 复刻演示'
    },
    {
      template: 'content',
      title: '日本市场概览',
      layout_desc: '左标题 + 右侧三个统计卡片',
      bullets: [
        { k: '1.24亿', v: '人口规模，高度城市化' },
        { k: '人均 $33K', v: '高消费力，品质敏感' },
        { k: '超 80%', v: '都市人口，便利店密度全球第一' }
      ],
      insight: '日本消费者对「细节」「故事」「信任」的支付意愿显著高于均价。'
    },
    {
      template: 'content',
      title: '四大核心策略',
      layout_desc: '2x2 矩阵卡片',
      grid: [
        { title: '物语化', desc: '把产品包装成故事与季节限定（桜/紅葉/新年）。' },
        { title: '极致细节', desc: '包装、说明卡、店员话术三层细节堆叠信任。' },
        { title: '体验场景', desc: '从卖「物」到卖「事」：咖啡馆即剧场，零售即策展。' },
        { title: '长期主义', desc: '品牌资产优先于短期 ROI，老铺百年叙事保值。' }
      ]
    },
    {
      template: 'content',
      title: '标杆案例',
      layout_desc: '左案例卡 + 右案例卡',
      cases: [
        { brand: '无印良品', point: '「这样就好」的反过度消费哲学', result: '全球 1100+ 店，自有品牌忠诚度行业第一梯队' },
        { brand: '蓝瓶咖啡', point: '一杯咖啡的仪式感与空间美学', result: '东京清澄白河店成朝圣地，单店坪效行业标杆' }
      ]
    },
    {
      template: 'content',
      title: '关键数据',
      layout_desc: '左侧条形图 + 右侧要点',
      chart: {
        type: 'bar',
        labels: ['故事化', '细节体验', '场景设计', '长期叙事', '价格战'],
        values: [78, 72, 65, 60, 22],
        unit: '%',
        caption: '日本消费者对各营销要素的支付意愿权重（示意）'
      },
      takeaway: '「价格战」权重最低——印证体验与叙事溢价的空间。'
    },
    {
      template: 'closing',
      title: '给中国团队的行动建议',
      layout_desc: '结尾页：三条行动 + 致谢',
      actions: [
        '选 1 个SKU做季节物语化试点，3 个月一周期',
        '把"开箱"升级为"开箱即策展"，重做包装与说明卡',
        '建立品牌叙事资产库，季度复盘而非单次ROI'
      ],
      closing: '谢谢 —— 用细节与故事，赢得愿意付溢价的用户。'
    }
  ]
};
