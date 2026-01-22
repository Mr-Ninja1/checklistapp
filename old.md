/* Futuristic splash */
#splash{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:99999;overflow:hidden;background:radial-gradient(closest-corner at 10% 20%, rgba(30,167,255,0.08), transparent 8%), radial-gradient(closest-corner at 90% 80%, rgba(111,92,255,0.06), transparent 10%), linear-gradient(180deg,#001021,#04122a)}
#splash::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(30,167,255,0.02),rgba(111,92,255,0.02));mix-blend-mode:screen;pointer-events:none}
#splashContent{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;padding:28px}
#logoContainer{margin-bottom:6px;position:relative}
#splash img#logo{width:150px;height:120px;border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02));box-shadow:0 12px 40px rgba(30,122,255,0.08), 0 2px 8px rgba(0,0,0,0.5);object-fit:contain;transform:translateZ(0);border:1px solid rgba(255,255,255,0.03)}
#logoContainer::after{content:'';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:220px;height:220px;border-radius:50%;background:conic-gradient(from 90deg, rgba(30,167,255,0.06), rgba(111,92,255,0.06), rgba(30,167,255,0.02));filter:blur(28px);opacity:0.6;z-index:-1;animation:spinSlow 8s linear infinite}
#bravo{font-size:44px;font-weight:900;color:linear-gradient(90deg,#e6fbff,#bfeeff);letter-spacing:6px;margin:0;text-shadow:0 6px 30px rgba(14,30,50,0.6);background:linear-gradient(90deg,#e6fbff,#bfeeff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
#subtitle{font-size:14px;color:rgba(190,238,255,0.85);margin:0;letter-spacing:1px}
#loadingMsg{font-size:15px;color:var(--muted);margin:0;letter-spacing:0.6px;min-height:20px;opacity:1}

/* animated arc behind logo */
.splash-arc{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:260px;height:260px;border-radius:50%;pointer-events:none;z-index:-2;background:radial-gradient(circle at center, rgba(30,167,255,0.06), transparent 40%);filter:blur(18px)}
@keyframes spinSlow{to{transform:translate(-50%,-50%) rotate(360deg)}}

/* Spinner animation */
.spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,0.3);border-top:4px solid #fff;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeInOut{0%,100%{opacity:0}50%{opacity:1}}
