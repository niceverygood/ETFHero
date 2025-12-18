import { NextResponse } from 'next/server';
import { ALL_ETFS, POPULAR_ETFS } from '@/lib/data/etf-list';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const region = searchParams.get('region');
    const popular = searchParams.get('popular');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let etfs = ALL_ETFS;
    
    // 카테고리 필터
    if (category) {
      etfs = etfs.filter(e => e.category === category);
    }
    
    // 지역 필터
    if (region) {
      etfs = etfs.filter(e => e.region === region);
    }
    
    // 인기 ETF만
    if (popular === 'true') {
      etfs = etfs.filter(e => POPULAR_ETFS.includes(e.ticker));
    }
    
    // 제한
    etfs = etfs.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: etfs.map(e => ({
        ticker: e.ticker,
        name: e.name,
        nameKo: e.nameKo,
        issuer: e.issuer,
        category: e.category,
        assetClass: e.assetClass,
        region: e.region,
        expenseRatio: e.expenseRatio,
        description: e.description,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch ETFs:', error);
    
    // Fallback to popular ETFs
    const fallbackETFs = ALL_ETFS.filter(e => POPULAR_ETFS.includes(e.ticker)).slice(0, 10);
    
    return NextResponse.json({
      success: true,
      data: fallbackETFs.map(e => ({
        ticker: e.ticker,
        name: e.name,
        nameKo: e.nameKo,
        issuer: e.issuer,
        category: e.category,
        assetClass: e.assetClass,
        region: e.region,
        expenseRatio: e.expenseRatio,
        description: e.description,
      })),
    });
  }
}
