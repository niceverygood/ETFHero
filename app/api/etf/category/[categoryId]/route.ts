import { NextRequest, NextResponse } from 'next/server';
import { ALL_ETFS } from '@/lib/data/etf-list';
import { getCachedETFPrice } from '@/lib/external/yahoo-finance';

// 카테고리 정의
const CATEGORIES: Record<string, {
  name: string;
  nameKo: string;
  description: string;
  filters: {
    categories?: string[];
    assetClasses?: string[];
    themes?: string[];
    keywords?: string[];
  };
}> = {
  'us-large-cap': {
    name: 'US Large Cap',
    nameKo: '미국 대형주',
    description: 'S&P 500, 다우존스 등 미국 대형주 중심의 ETF',
    filters: {
      categories: ['Equity', 'Index'],
      keywords: ['S&P', 'Large', 'Dow', 'Total Market', 'US'],
    },
  },
  'tech-semi': {
    name: 'Technology & Semiconductors',
    nameKo: '기술/반도체',
    description: '나스닥, 반도체, AI 등 기술 섹터 ETF',
    filters: {
      categories: ['Sector'],
      themes: ['Technology', 'Semiconductor', 'AI'],
      keywords: ['Tech', 'Nasdaq', 'Semiconductor', 'QQQ', 'SMH', 'SOXX', 'XLK'],
    },
  },
  'growth': {
    name: 'Growth',
    nameKo: '성장주',
    description: '성장 잠재력이 높은 기업 중심의 ETF',
    filters: {
      categories: ['Growth', 'Thematic'],
      keywords: ['Growth', 'Innovation', 'ARKK', 'VUG', 'IWF'],
    },
  },
  'dividend': {
    name: 'Dividend',
    nameKo: '배당',
    description: '고배당, 배당 성장 중심의 ETF',
    filters: {
      categories: ['Dividend'],
      keywords: ['Dividend', 'Income', 'SCHD', 'VYM', 'JEPI', 'HDV', 'DVY'],
    },
  },
  'bond': {
    name: 'Bonds & Fixed Income',
    nameKo: '채권',
    description: '국채, 회사채, 하이일드 채권 ETF',
    filters: {
      assetClasses: ['Bond', 'Fixed Income'],
      keywords: ['Bond', 'Treasury', 'Corporate', 'TLT', 'BND', 'AGG', 'LQD'],
    },
  },
  'international': {
    name: 'International & Emerging Markets',
    nameKo: '해외/신흥국',
    description: '글로벌, 신흥국, 선진국 ETF',
    filters: {
      categories: ['International'],
      keywords: ['International', 'Emerging', 'Global', 'VXUS', 'VEA', 'EFA', 'EEM', 'IEMG'],
    },
  },
  'real-estate': {
    name: 'Real Estate',
    nameKo: '부동산',
    description: 'REITs, 부동산 섹터 ETF',
    filters: {
      categories: ['Real Estate', 'Sector'],
      keywords: ['Real Estate', 'REIT', 'VNQ', 'IYR', 'XLRE'],
    },
  },
  'thematic': {
    name: 'Thematic',
    nameKo: '테마',
    description: 'AI, 클린에너지, 헬스케어 등 테마 ETF',
    filters: {
      categories: ['Thematic'],
      themes: ['AI', 'Clean Energy', 'Healthcare', 'Metaverse', 'EV', 'Blockchain'],
      keywords: ['Clean', 'Energy', 'Health', 'AI', 'Cyber', 'ICLN', 'XLV', 'BOTZ'],
    },
  },
};

// ETF 필터링 함수
function filterETFsByCategory(categoryId: string): typeof ALL_ETFS {
  const category = CATEGORIES[categoryId];
  if (!category) return [];

  const { filters } = category;
  
  return ALL_ETFS.filter(etf => {
    // 카테고리 매칭
    if (filters.categories?.length) {
      const categoryMatch = filters.categories.some(cat => 
        etf.category?.toLowerCase().includes(cat.toLowerCase())
      );
      if (categoryMatch) return true;
    }
    
    // 자산 클래스 매칭
    if (filters.assetClasses?.length) {
      const assetMatch = filters.assetClasses.some(asset => 
        etf.assetClass?.toLowerCase().includes(asset.toLowerCase())
      );
      if (assetMatch) return true;
    }
    
    // 테마 매칭
    if (filters.themes?.length) {
      const themeMatch = filters.themes.some(theme => 
        etf.name?.toLowerCase().includes(theme.toLowerCase()) ||
        etf.description?.toLowerCase().includes(theme.toLowerCase())
      );
      if (themeMatch) return true;
    }
    
    // 키워드 매칭
    if (filters.keywords?.length) {
      const keywordMatch = filters.keywords.some(keyword => {
        const kw = keyword.toLowerCase();
        return (
          etf.ticker?.toLowerCase().includes(kw) ||
          etf.name?.toLowerCase().includes(kw) ||
          etf.nameKo?.toLowerCase().includes(kw) ||
          etf.description?.toLowerCase().includes(kw) ||
          etf.category?.toLowerCase().includes(kw)
        );
      });
      if (keywordMatch) return true;
    }
    
    return false;
  });
}

/**
 * GET /api/etf/category/[categoryId]
 * 
 * 카테고리별 ETF 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { categoryId } = params;
    const { searchParams } = new URL(request.url);
    const withPrice = searchParams.get('withPrice') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '50');

    // 카테고리 정보 확인
    const categoryInfo = CATEGORIES[categoryId];
    if (!categoryInfo) {
      return NextResponse.json({
        success: false,
        error: 'Category not found',
        availableCategories: Object.keys(CATEGORIES),
      }, { status: 404 });
    }

    // ETF 필터링
    let etfs = filterETFsByCategory(categoryId).slice(0, limit);

    // 실시간 가격 추가
    const etfsWithPrice = await Promise.all(
      etfs.map(async (etf) => {
        let price, change, changePercent;
        
        if (withPrice && etf.region === 'US') {
          try {
            const quote = await getCachedETFPrice(etf.ticker);
            if (quote) {
              price = quote.price;
              change = quote.change;
              changePercent = quote.changePercent;
            }
          } catch (e) {
            console.error(`Price fetch failed for ${etf.ticker}:`, e);
          }
        }

        return {
          ticker: etf.ticker,
          name: etf.name,
          nameKo: etf.nameKo,
          issuer: etf.issuer,
          category: etf.category,
          assetClass: etf.assetClass,
          region: etf.region,
          expenseRatio: etf.expenseRatio,
          aum: etf.aum,
          description: etf.description,
          price,
          change,
          changePercent,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        category: {
          id: categoryId,
          ...categoryInfo,
        },
        etfs: etfsWithPrice,
        totalCount: etfsWithPrice.length,
      },
    });
  } catch (error) {
    console.error('Category ETF API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch category ETFs',
    }, { status: 500 });
  }
}

