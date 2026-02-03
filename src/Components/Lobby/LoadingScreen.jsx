import React from 'react';
import styled from 'styled-components';

const LoadingScreen = ({ message = "WAKING UP THE WALL..." }) => {
  // We create 9 spheres, and each sphere has 9 items (81 total divs)
  // This is much cleaner than hard-coding 100 lines of HTML!
  const spheres = Array.from({ length: 9 });
  const items = Array.from({ length: 9 });

  return (
    <StyledWrapper>
      <div className="overlay-content">
        <section className="container-loader">
          <section className="loader">
            {spheres.map((_, sIdx) => (
              <article 
                key={sIdx} 
                className={`sphere sphere${sIdx + 1}`} 
                style={{ '--rot': sIdx }}
              >
                {items.map((_, iIdx) => (
                  <div 
                    key={iIdx} 
                    className="item" 
                    style={{ '--rot-y': iIdx + 1 }} 
                  />
                ))}
              </article>
            ))}
          </section>
        </section>

        {/* This text lets the user know the server is waking up */}
        <div className="loading-text">
          <h2>{message}</h2>
          <div className="status-bar">
            <div className="status-progress"></div>
          </div>
          <p>Syncing Real-Time Mural Data</p>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  position: fixed;
  inset: 0;
  background: #050505;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;

  .container-loader {
    transform: scale(0.4); 
    height: 400px;
    width: 400px;
    display: flex;
    justify-content: center;
    align-items: center;

    .loader {
      animation: girar 8s linear infinite;
      &, .sphere, .item {
        width: 400px;
        height: 400px;
        position: absolute;
        transform-style: preserve-3d;
        perspective: 10000px;
      }

      .sphere {
        transform: rotate(calc(var(--rot) * 20deg));
        /* Dynamic Colors for each sphere */
        &.sphere1 { --bg: #ff000088; }
        &.sphere2 { --bg: #ff00ff88; }
        &.sphere3 { --bg: #ffff0088; }
        &.sphere4 { --bg: #00ff0088; }
        &.sphere5 { --bg: #00ffff88; }
        &.sphere6 { --bg: #0000ff88; }
        &.sphere7 { --bg: #dc1ddf88; }
        &.sphere8 { --bg: #ffa50088; }
        &.sphere9 { --bg: #e5b2ca88; }
      }

      .item {
        border-radius: 50%;
        background: var(--bg);
        transform: rotateY(calc(var(--rot-y) * 40deg));
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
    }
  }

  .loading-text {
    margin-top: 3rem;
    text-align: center;
    
    h2 {
      color: white;
      font-family: sans-serif;
      font-weight: 900;
      font-style: italic;
      letter-spacing: 2px;
      font-size: 1.2rem;
      text-transform: uppercase;
      animation: pulse 2s infinite;
    }

    .status-bar {
      width: 200px;
      height: 2px;
      background: rgba(255,255,255,0.1);
      margin: 15px auto;
      overflow: hidden;
      .status-progress {
        width: 40%;
        height: 100%;
        background: yellow;
        animation: loading-bar 2s infinite ease-in-out;
      }
    }

    p {
      color: #555;
      font-family: monospace;
      font-size: 0.7rem;
      letter-spacing: 0.4em;
    }
  }

  @keyframes girar {
    from { transform: rotateX(0deg) rotateY(0deg); }
    to { transform: rotateX(360deg) rotateY(360deg); }
  }

  @keyframes pulse {
    50% { opacity: 0.5; }
  }

  @keyframes loading-bar {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(250%); }
  }

  @media (max-width: 600px) {
    .container-loader { transform: scale(0.3); }
  }
`;

export default LoadingScreen;