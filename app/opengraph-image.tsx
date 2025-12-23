import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'ETFHero - AI ETF 분석 플랫폼';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
          }}
        />
        
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              borderRadius: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 60,
              color: 'white',
              fontWeight: 900,
              marginRight: 24,
            }}
          >
            E
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-2px',
            }}
          >
            ETFHero
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          AI 3대장과 함께하는 스마트한 ETF 투자
        </div>

        {/* AI Characters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
            marginTop: 48,
          }}
        >
          {[
            { name: 'Claude', color: '#3B82F6' },
            { name: 'Gemini', color: '#8B5CF6' },
            { name: 'GPT', color: '#F59E0B' },
          ].map((ai) => (
            <div
              key={ai.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  background: ai.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  color: 'white',
                  fontWeight: 700,
                }}
              >
                {ai.name[0]}
              </div>
              <div style={{ color: '#64748b', fontSize: 18 }}>{ai.name}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 20,
            color: '#475569',
          }}
        >
          etf-hero.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

