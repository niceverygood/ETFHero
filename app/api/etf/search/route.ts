import { NextRequest, NextResponse } from 'next/server';
import { 
  ALL_ETFS, 
  ETF_CATEGORIES, 
  searchETFsByName, 
  getETFsByCategory,
  getETFsByRegion,
  findETFByTicker,
  POPULAR_ETFS,
} from '@/lib/data/etf-list';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const region = searchParams.get('region');
  const issuer = searchParams.get('issuer');
  const limit = parseInt(searchParams.get('limit') || '50');
  const popular = searchParams.get('popular') === 'true';
  const sortBy = searchParams.get('sortBy') || 'name'; // name, expenseRatio, aum

  try {
    let results = ALL_ETFS;

    // 인기 ETF만
    if (popular) {
      results = results.filter(e => POPULAR_ETFS.includes(e.ticker));
    }

    // 검색어 필터
    if (query && query.length >= 1) {
      results = searchETFsByName(query);
    }

    // 카테고리 필터
    if (category && category !== 'all') {
      results = results.filter(e => e.category === category);
    }

    // 지역 필터
    if (region && region !== 'all') {
      results = results.filter(e => e.region === region);
    }

    // 운용사 필터
    if (issuer && issuer !== 'all') {
      results = results.filter(e => e.issuer === issuer);
    }

    // 정렬
    switch (sortBy) {
      case 'expenseRatio':
        results = [...results].sort((a, b) => a.expenseRatio - b.expenseRatio);
        break;
      case 'aum':
        results = [...results].sort((a, b) => (b.aum || 0) - (a.aum || 0));
        break;
      case 'ticker':
        results = [...results].sort((a, b) => a.ticker.localeCompare(b.ticker));
        break;
      default:
        // 기본: 이름순
        results = [...results].sort((a, b) => a.nameKo.localeCompare(b.nameKo));
    }

    // 결과 제한
    const limitedResults = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      query,
      results: limitedResults.map(e => ({
        ticker: e.ticker,
        name: e.name,
        nameKo: e.nameKo,
        issuer: e.issuer,
        category: e.category,
        assetClass: e.assetClass,
        region: e.region,
        expenseRatio: e.expenseRatio,
        aum: e.aum,
        description: e.description,
      })),
      categories: ETF_CATEGORIES,
      total: limitedResults.length,
      hasMore: results.length > limit,
    });

  } catch (error) {
    console.error('ETF search error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search ETFs',
      results: [],
      categories: ETF_CATEGORIES,
      total: 0,
    }, { status: 500 });
  }
}

/**
 * POST - 특정 ETF 티커의 상세 정보 조회
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker } = body;

    if (!ticker) {
      return NextResponse.json({
        success: false,
        error: 'Ticker is required',
      }, { status: 400 });
    }

    const etf = findETFByTicker(ticker);

    if (etf) {
      return NextResponse.json({
        success: true,
        data: {
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
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: 'ETF not found',
    }, { status: 404 });

  } catch (error) {
    console.error('ETF info fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch ETF info',
    }, { status: 500 });
  }
}

