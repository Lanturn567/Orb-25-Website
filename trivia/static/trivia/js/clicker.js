const pokemonList = [
    'Altaria.png',
    'Blitzle.png',
    'Chinchou.png',
    'Cubone.png',
    'Happiny.png',
    'Litwick.png',
    'Lopunny.png',
    'Marowak.png',
    'Munchlax.png',
    'Munna.png',
    'Musharna.png',
    'Ponyta.png',
    'Quagsire.png',
    'Roselia.png',
    'Staraptor.png',
    'Starly.png',
    'Swablu.png',
    'Torterra.png',
    'Wooper.png',
    'Zebstrika.png',
];

const getRandomPosition = () => {
    const headerSize = window.innerWidth <= 768 ? 60 : 80;
    const margin = window.innerWidth <= 768 ? 30 : 60;

    const x = margin + Math.random() * (window.innerWidth - margin * 2);
    const y = headerSize + margin + Math.random() * (window.innerHeight - headerSize - margin * 2);

    return { x, y };
};

// Utility functions
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function handleApiResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || 'API request failed');
        error.status = response.status;
        error.data = errorData;
        throw error;
    }
    return response.json();
}

// UI Components
function Title({ text }) {
    return (
        <h1 style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: "2.3rem",
            color: "#5a2a0a",
            textShadow: `
                2px 2px 4px rgba(255, 180, 100, 0.4),
                0 0 10px rgba(255, 214, 102, 0.3),
                0 0 20px rgba(255, 140, 0, 0.2)
            `,
            marginBottom: "20px",
            marginTop: "0",
            background: "linear-gradient(to right, #ff8e53, #ff6b95)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "inline-block",
            padding: "0 20px",
            letterSpacing: "1px",
            transform: "rotate(-2deg)",
            animation: "titleGlow 3s ease-in-out infinite alternate"
        }}>
            {text}
            <style jsx>{`
                @keyframes titleGlow {
                    0% {
                        text-shadow:
                                2px 2px 4px rgba(255, 180, 100, 0.4),
                                0 0 10px rgba(255, 214, 102, 0.3),
                                0 0 20px rgba(255, 140, 0, 0.2);
                    }
                    100% {
                        text-shadow:
                                2px 2px 6px rgba(255, 180, 100, 0.6),
                                0 0 15px rgba(255, 214, 102, 0.5),
                                0 0 30px rgba(255, 140, 0, 0.3);
                    }
                }
            `}</style>
        </h1>
    );
}

function Score({ score, achievedMilestones, setAchievedMilestones }) {
    const [animation, setAnimation] = React.useState('');
    const animationRef = React.useRef(null);

    const milestones = [
        { threshold: 10, animation: 'celebrate', color: '#ff8e53' },
        { threshold: 50, animation: 'bounce', color: '#ff6b95' },
        { threshold: 100, animation: 'spin', color: '#4ecdc4' },
        { threshold: 250, animation: 'glow', color: '#45b7d1' },
        { threshold: 500, animation: 'jump', color: '#ffbe0b' },
        { threshold: 1000, animation: 'rainbow', color: 'linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)' },
        { threshold: 2500, animation: 'pulse', color: '#ff006e' },
        { threshold: 5000, animation: 'explode', color: '#8338ec' },
        { threshold: 10000, animation: 'fireworks', color: '#3a86ff' }
    ];

    const formatScore = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    React.useEffect(() => {
        const newlyAchieved = milestones.filter(m =>
            score >= m.threshold &&
            !achievedMilestones.includes(m.threshold)
        );

        if (newlyAchieved.length > 0) {
            const highestNewMilestone = newlyAchieved.reduce((prev, current) =>
                (prev.threshold > current.threshold) ? prev : current
            );

            setAnimation(highestNewMilestone.animation);
            setAchievedMilestones(prev => [...prev, ...newlyAchieved.map(m => m.threshold)]);

            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }

            animationRef.current = setTimeout(() => {
                setAnimation('');
            }, 3000);
        }

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, [score]);

    const getAnimationStyle = () => {
        const baseStyle = {
            fontFamily: "'Bangers', cursive",
            fontSize: "2rem",
            margin: "20px 0",
            display: "inline-block",
            padding: "10px 30px",
            letterSpacing: "2px",
            transform: "rotate(-2deg)",
            color: "#5a2a0a",
            textShadow: "2px 2px 4px rgba(255,180,100,0.4)",
            background: 'linear-gradient(to right, #ff8e53, #ff6b95)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            border: '3px solid gold',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        };

        const milestone = milestones.find(m => m.animation === animation);
        const color = milestone ? milestone.color : baseStyle.color;

        switch(animation) {
            case 'celebrate':
                return {
                    ...baseStyle,
                    animation: 'celebrate 0.5s ease 3',
                    color: color
                };
            case 'bounce':
                return {
                    ...baseStyle,
                    animation: 'bounce 0.8s ease 3',
                    color: color
                };
            case 'spin':
                return {
                    ...baseStyle,
                    animation: 'spin 1s linear 3',
                    color: color
                };
            case 'glow':
                return {
                    ...baseStyle,
                    animation: 'glow 1.5s ease-in-out infinite alternate',
                    color: color,
                    textShadow: `0 0 10px ${color}`
                };
            case 'jump':
                return {
                    ...baseStyle,
                    animation: 'jump 0.5s ease 3',
                    color: color
                };
            case 'rainbow':
                return {
                    ...baseStyle,
                    animation: 'rainbow 2s linear infinite',
                    background: color,
                    WebkitBackgroundClip: 'text'
                };
            case 'pulse':
                return {
                    ...baseStyle,
                    animation: 'pulse 1s ease infinite',
                    color: color
                };
            case 'explode':
                return {
                    ...baseStyle,
                    animation: 'explode 0.5s ease-out',
                    color: color,
                    transformOrigin: 'center'
                };
            case 'fireworks':
                return {
                    ...baseStyle,
                    animation: 'fireworks 1s ease-out',
                    color: color,
                    textShadow: `0 0 15px ${color}`
                };
            default:
                return baseStyle;
        }
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <h1 style={getAnimationStyle()}>
                Score: {formatScore(score)}
            </h1>

            <style>{`
                @keyframes celebrate {
                    0%, 100% { transform: rotate(-2deg) scale(1); }
                    50% { transform: rotate(5deg) scale(1.3); }
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0) rotate(-2deg); }
                    50% { transform: translateY(-20px) rotate(-2deg); }
                }
                
                @keyframes spin {
                    from { transform: rotate(-2deg); }
                    to { transform: rotate(358deg); }
                }
                
                @keyframes glow {
                    from { text-shadow: 0 0 5px currentColor; }
                    to { text-shadow: 0 0 15px currentColor; }
                }
                
                @keyframes jump {
                    0%, 100% { transform: translateY(0) rotate(-2deg); }
                    50% { transform: translateY(-15px) rotate(-2deg); }
                }
                
                @keyframes rainbow {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: rotate(-2deg) scale(1); }
                    50% { transform: rotate(-2deg) scale(1.2); }
                }
                
                @keyframes explode {
                    0% { transform: rotate(-2deg) scale(1); }
                    50% { transform: rotate(-2deg) scale(1.5); }
                    100% { transform: rotate(-2deg) scale(1); }
                }
                
                @keyframes fireworks {
                    0% { transform: rotate(-2deg) scale(0.8); opacity: 0.5; }
                    50% { transform: rotate(-2deg) scale(1.2); opacity: 1; }
                    100% { transform: rotate(-2deg) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

function Button({ text, color, onClick, disabled = false, style = {} }) {
    return (
        <button
            style={{
                fontFamily: "'Dancing Script', cursive",
                backgroundColor: color,
                border: "2px solid snow",
                color: "ghostwhite",
                fontWeight: "bold",
                fontSize: "1.4rem",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: disabled ? "not-allowed" : "pointer",
                margin: "10px",
                transition: "transform 0.4s ease, box-shadow 0.4s ease",
                boxShadow: "0 4px 12px rgba(198, 183, 254, 0.5)",
                opacity: disabled ? 0.7 : 1,
                ...style
            }}
            onMouseEnter={e => !disabled && (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseLeave={e => !disabled && (e.currentTarget.style.transform = "scale(1)")}
            onMouseDown={e => !disabled && (e.currentTarget.style.transform = "scale(0.9)")}
            onMouseUp={e => !disabled && (e.currentTarget.style.transform = "scale(1)")}
            onClick={!disabled ? onClick : undefined}
            disabled={disabled}
        >
            {text}
        </button>
    );
}

function Header({ user, onUserUpdate, onNavigate }) {
    const [isMuted, setIsMuted] = React.useState(true);
    const [showLogin, setShowLogin] = React.useState(false);
    const [showRegister, setShowRegister] = React.useState(false);
    const audioRef = React.useRef(null);
    const [isMobile, setIsMobile] = React.useState(false);

    // Memoize the onUserUpdate function if it's passed from parent
    const stableOnUserUpdate = React.useCallback(onUserUpdate, []);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    React.useEffect(() => {
        const audio = audioRef.current;
        audio.volume = 0.2;
        audio.pause();

        const handleFirstPlay = () => {
            if (isMuted) {
                audio.play()
                    .then(() => setIsMuted(false))
                    .catch(console.error);
            }
        };

        document.addEventListener('pointerdown', handleFirstPlay);
        return () => document.removeEventListener('pointerdown', handleFirstPlay);
    }, [isMuted]);

    React.useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await fetch('/trivia/api/check_auth/', {
                    credentials: 'include'
                });
                const data = await handleApiResponse(response);
                if (data.isAuthenticated) {
                    // Only call onUserUpdate if it exists, no need for setUser here
                    if (stableOnUserUpdate) {
                        stableOnUserUpdate(data.user);
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            }
        };
        checkAuthStatus();
    }, [stableOnUserUpdate]);  // Now using the memoized version

    const toggleMute = () => {
        const audio = audioRef.current;
        if (audio.paused) {
            audio.play();
            setIsMuted(false);
        } else {
            audio.pause();
            setIsMuted(true);
        }
    };

    const handleLogin = (userData) => {
        if (onUserUpdate) {
            onUserUpdate(userData.user);
        }
        setShowLogin(false);
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('/trivia/api/logout/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken') || '',
                }
            });

            if (response.ok) {
                // Use onUserUpdate to clear the user in the parent component
                if (onUserUpdate) onUserUpdate(null);
                onNavigate('home');
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };


    return (
        <div className="header-bg">
            <audio ref={audioRef} loop>
                <source src="/static/trivia/assets/bgm.mp3" type="audio/mpeg" />
            </audio>

            <div className="header-main">
                <button
                    className="header-main-button"
                    onClick={() => (window.location.href = "/")}
                >
                    HOME
                </button>
            </div>

            {!isMobile && (
                <div className="header-images">
                    <img className="header-image" src="/static/timer/assets/Buneary.png" alt="Buneary" />
                    <img className="header-image" src="/static/timer/assets/Chandelure.png" alt="Chandelure" />
                    <img className="header-image" src="/static/timer/assets/Ditto.png" alt="Ditto" />
                    <img className="header-image" src="/static/timer/assets/Rapidash.png" alt="Rapidash" />
                    <img className="header-gif" src="/static/timer/assets/logo.gif" style={{ marginLeft: "10px", marginRight: "10px" }} alt="Logo" />
                    <img className="header-image" src="/static/timer/assets/Snorlax.png" alt="Snorlax" />
                    <img className="header-image" src="/static/timer/assets/Luvdisc.png" alt="Luvdisc" />
                    <img className="header-image" src="/static/timer/assets/Maractus.png" alt="Maractus" />
                    <img className="header-image" src="/static/timer/assets/Lanturn.png" alt="Lanturn" />
                </div>
            )}

            <div className="header-circles">
                <button
                    id="volume-button"
                    className="header-circle-button"
                    onClick={toggleMute}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '24px',
                        border: '2px solid white',
                        backgroundColor: '#74b9ff',
                        color: 'white',
                        fontSize: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)';
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'scale(0.95)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(52, 152, 219, 0.2)';
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)';
                    }}
                >
                    <i
                        id="volume-icon"
                        className={`fa-solid ${isMuted ? 'fa-volume-mute' : 'fa-volume-high'}`}
                    ></i>
                </button>

                {user ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontFamily: "'Dancing Script', cursive",
                        fontSize: '1.2rem',
                        color: '#5a2a0a'
                    }}>
                        <span>Welcome, {user.username}!</span>
                        <button
                            onClick={handleLogout}
                            style={{
                                marginLeft: '10px',
                                background: '#ff6b6b',
                                color: 'white',
                                border: '2px solid white',
                                borderRadius: '8px',
                                padding: '5px 15px',
                                cursor: 'pointer',
                                fontFamily: "'Dancing Script', cursive",
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 8px rgba(255, 107, 107, 0.3)',
                                transform: 'scale(1)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 6px 12px rgba(255, 107, 107, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(255, 107, 107, 0.3)';
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'scale(0.95)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(255, 107, 107, 0.2)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 6px 12px rgba(255, 107, 107, 0.4)';
                            }}
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowLogin(true)}
                        style={{
                            marginLeft: '15px',
                            background: '#55efc4',
                            color: 'white',
                            border: '2px solid white',
                            borderRadius: '8px',
                            padding: '5px 15px',
                            cursor: 'pointer',
                            fontFamily: "'Dancing Script', cursive",
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 8px rgba(85, 239, 196, 0.3)',
                            transform: 'scale(1)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 6px 12px rgba(85, 239, 196, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(85, 239, 196, 0.3)';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.95)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(85, 239, 196, 0.2)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 6px 12px rgba(85, 239, 196, 0.4)';
                        }}
                    >
                        Login
                    </button>
                )}
            </div>

            {showLogin && (
                <LoginScreen
                    onLogin={handleLogin}
                    onSwitchToRegister={() => {
                        setShowLogin(false);
                        setShowRegister(true);
                    }}
                    onClose={() => setShowLogin(false)}
                />
            )}

            {showRegister && (
                <RegisterScreen
                    onRegister={(data) => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                    onSwitchToLogin={() => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                    onClose={() => setShowRegister(false)}
                />
            )}
        </div>
    );
}

function Clickable({onScore}) {
    const [sprites, setSprites] = React.useState([]);

    const pokemonList = [
        {src: 'Altaria.png', type: 'dragon/flying', points: 15},
        {src: 'Blitzle.png', type: 'electric', points: 8},
        {src: 'Chinchou.png', type: 'water/electric', points: 10},
        {src: 'Cubone.png', type: 'ground', points: 8},
        {src: 'Happiny.png', type: 'normal', points: 5},
        {src: 'Litwick.png', type: 'ghost/fire', points: 12},
        {src: 'Lopunny.png', type: 'normal', points: 10},
        {src: 'Marowak.png', type: 'ground', points: 12},
        {src: 'Munchlax.png', type: 'normal', points: 8},
        {src: 'Munna.png', type: 'psychic', points: 7},
        {src: 'Musharna.png', type: 'psychic', points: 14},
        {src: 'Ponyta.png', type: 'fire', points: 9},
        {src: 'Quagsire.png', type: 'water/ground', points: 11},
        {src: 'Roselia.png', type: 'grass/poison', points: 10 },
        { src: 'Staraptor.png', type: 'normal/flying', points: 16 },
        { src: 'Starly.png', type: 'normal/flying', points: 6 },
        { src: 'Swablu.png', type: 'normal/flying', points: 7 },
        { src: 'Torterra.png', type: 'grass/ground', points: 18 },
        { src: 'Wooper.png', type: 'water/ground', points: 6 },
        { src: 'Zebstrika.png', type: 'electric', points: 13 }
    ];

    React.useEffect(() => {
        const spawnRandomSprite = () => {
            const delay = 500 + Math.random() * 2000;

            const spawnTimer = setTimeout(() => {
                const id = Date.now() + Math.random();
                const position = getRandomPosition();
                const pokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
                const isShiny = Math.random() < 0.05;

                const size = 1 + Math.random() * 2.4;
                const duration = 2000 + Math.random() * 2000;

                setSprites(prev => [...prev, {
                    id,
                    top: position.y,
                    left: position.x,
                    src: pokemon.src,
                    type: pokemon.type,
                    points: pokemon.points,
                    isShiny,
                    opacity: 0,
                    scale: 0.5 * size,
                    size,
                    duration
                }]);

                setTimeout(() => {
                    setSprites(prev => prev.map(sprite =>
                        sprite.id === id ? { ...sprite, opacity: 1, scale: size } : sprite
                    ));
                }, 50);

                setTimeout(() => {
                    setSprites(prev => prev.map(sprite =>
                        sprite.id === id ? { ...sprite, opacity: 0.5 } : sprite
                    ));
                }, duration - 500);

                setTimeout(() => {
                    setSprites(prev => prev.filter(sprite => sprite.id !== id));
                }, duration);

                spawnRandomSprite();
            }, delay);

            return () => clearTimeout(spawnTimer);
        };

        const cleanup = spawnRandomSprite();
        return () => cleanup();
    }, []);

    const handleSpriteClick = (id) => {
        const clickedSprite = sprites.find(sprite => sprite.id === id);
        if (!clickedSprite) return;

        setSprites(prev => prev.map(sprite =>
            sprite.id === id ? {
                ...sprite,
                clicked: true,
                scale: sprite.size * 1.1,
                isShiny: sprite.isShiny
            } : sprite
        ));

        setTimeout(() => {
            setSprites(prev => prev.filter(sprite => sprite.id !== id));
        }, 200);

        const points = clickedSprite.isShiny ? clickedSprite.points * 10 : clickedSprite.points;
        onScore(points);
    };

    return (
        <div style={{position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100}}>
            {sprites.map(sprite => (
                <div
                    key={sprite.id}
                    style={{
                        position: "absolute",
                        top: `${sprite.top}px`,
                        left: `${sprite.left}px`,
                        pointerEvents: "auto",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        opacity: sprite.clicked ? 0 : sprite.opacity,
                        transform: `scale(${sprite.clicked ? 1.5 : sprite.scale})`,
                        filter: sprite.isShiny ?
                            (sprite.clicked ? "brightness(2) drop-shadow(0 0 8px gold)" : "drop-shadow(0 0 8px gold)") :
                            (sprite.clicked ? "brightness(2)" : "none"),
                        zIndex: sprite.isShiny ? 101 : 100
                    }}
                    onClick={() => handleSpriteClick(sprite.id)}
                >
                    <img
                        src={`/static/trivia/assets/${sprite.src}`}
                        alt={sprite.src}
                        style={{
                            width: window.innerWidth <= 768 ? "40px" : "60px",
                            height: window.innerWidth <= 768 ? "40px" : "60px",
                            objectFit: "contain"
                        }}
                    />
                    {sprite.isShiny && (
                        <div style={{
                            position: "absolute",
                            top: "-10px",
                            left: "-10px",
                            width: "80px",
                            height: "80px",
                            background: "radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0) 70%)",
                            animation: "pulse 1s infinite alternate"
                        }}/>
                    )}
                </div>
            ))}
        </div>
    );
}

function CreditsScreen({onBack}) {
    return (
        <div style={{
            position: "relative",
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255, 245, 230, 0.9)',
            borderRadius: '20px',
            maxWidth: '400px',
            margin: 'auto',
            marginTop: '60px',
            boxShadow: '0 10px 30px rgba(255, 140, 0, 0.3)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 180, 100, 0.2)'
        }}>
            <Title text="Credits"/>
            <div style={{
                textAlign: 'center',
                fontFamily: "'Dancing Script', cursive",
                margin: '30px 0',
                padding: '0 20px',
                color: '#5a2a0a'
            }}>
                <div style={{
                    marginBottom: '20px',
                    padding: '12px 20px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 8px rgba(255, 140, 0, 0.1)',
                    transition: 'all 0.3s ease'
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        lineHeight: '1.5'
                    }}>Created with React and ❤️</p>
                </div>

                <div style={{
                    marginBottom: '20px',
                    padding: '12px 20px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 8px rgba(255, 140, 0, 0.1)',
                    transition: 'all 0.3s ease'
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        lineHeight: '1.5'
                    }}>Pokémon assets © Nintendo</p>
                </div>

                <div style={{
                    marginBottom: '20px',
                    padding: '12px 20px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 8px rgba(255, 140, 0, 0.1)',
                    transition: 'all 0.3s ease'
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        lineHeight: '1.5'
                    }}>Sound effects from freesound.org</p>
                </div>

                <div style={{
                    marginBottom: '20px',
                    padding: '12px 20px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 8px rgba(255, 140, 0, 0.1)',
                    transition: 'all 0.3s ease'
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        lineHeight: '1.5'
                    }}>Fonts from Google Fonts</p>
                </div>
            </div>
            <Button
                text="Back to Home"
                color="#ff6b95"
                onClick={onBack}
                style={{ marginTop: '20px' }}
            />
        </div>
    );
}

function LeaderboardScreen({ onBack }) {
    const [scores, setScores] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [userScore, setUserScore] = React.useState(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [totalEntries, setTotalEntries] = React.useState(0);
    const entriesPerPage = 8;

    const fetchLeaderboard = async (page = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`/trivia/api/leaderboard/?page=${page}`);
            const data = await handleApiResponse(response);

            setScores(data.results || data);
            setCurrentPage(page);

            if (data.count !== undefined) {
                setTotalEntries(data.count);
                setTotalPages(Math.ceil(data.count / entriesPerPage));
            } else {
                setTotalEntries(data.length);
                setTotalPages(1);
            }

            const authResponse = await fetch('/trivia/api/check_auth/');
            const authData = await handleApiResponse(authResponse);
            if (authData.isAuthenticated) {
                setUserScore({
                    username: authData.user.username,
                    score: authData.user.max_score,
                    isCurrentUser: true
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchLeaderboard(1);
    }, []);

    const formatScore = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchLeaderboard(newPage);
        }
    };

    if (loading && currentPage === 1) {
        return (
            <div style={{
                position: "relative",
                textAlign: 'center',
                padding: '40px',
                background: 'rgba(255, 245, 230, 0.9)',
                borderRadius: '20px',
                maxWidth: '400px',
                margin: 'auto',
                marginTop: '60px',
                boxShadow: '0 10px 30px rgba(255, 140, 0, 0.3)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 180, 100, 0.2)'
            }}>
                <Title text="Leaderboard" />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                position: "relative",
                textAlign: 'center',
                padding: '40px',
                background: 'rgba(255, 245, 230, 0.9)',
                borderRadius: '20px',
                maxWidth: '400px',
                margin: 'auto',
                marginTop: '60px',
                boxShadow: '0 10px 30px rgba(255, 140, 0, 0.3)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 180, 100, 0.2)'
            }}>
                <Title text="Leaderboard" />
                <div style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: '1.3rem',
                    color: 'red',
                    margin: '20px 0'
                }}>
                    Error: {error}
                </div>
                <Button
                    text="Back to Home"
                    color="#ff6b95"
                    onClick={onBack}
                    style={{ marginTop: '20px' }}
                />
            </div>
        );
    }

    return (
        <div style={{
            position: "relative",
            textAlign: 'center',
            padding: '20px', // Reduced padding
            background: 'rgba(255, 245, 230, 0.9)',
            borderRadius: '20px',
            maxWidth: '380px', // Slightly reduced width
            margin: 'auto',
            marginTop: '40px', // Reduced top margin
            boxShadow: '0 10px 30px rgba(255, 140, 0, 0.3)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 180, 100, 0.2)'
        }}>
            <Title text="Leaderboard" />

            {/* Compact Table */}
            <div style={{
                width: '100%',
                margin: '10px 0' // Reduced margin
            }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: '0 4px', // Reduced spacing between rows
                    fontSize: '0.9rem' // Smaller font size
                }}>
                    <thead>
                    <tr>
                        <th style={{
                            fontFamily: "'Bangers', cursive",
                            color: '#5a2a0a',
                            padding: '3px',
                            textAlign: 'center',
                            fontSize: '1rem' // Slightly larger for headers
                        }}>Rank</th>
                        <th style={{
                            fontFamily: "'Bangers', cursive",
                            color: '#5a2a0a',
                            padding: '3px',
                            textAlign: 'left',
                            fontSize: '1rem'
                        }}>Player</th>
                        <th style={{
                            fontFamily: "'Bangers', cursive",
                            color: '#5a2a0a',
                            padding: '3px',
                            textAlign: 'right',
                            fontSize: '1rem'
                        }}>Score</th>
                    </tr>
                    </thead>
                    <tbody>
                    {scores.map((entry, index) => (
                        <tr key={index} style={{
                            backgroundColor: entry.isCurrentUser ? 'rgba(255, 214, 102, 0.3)' : 'rgba(255, 255, 255, 0.6)',
                            borderRadius: '8px',
                        }}>
                            <td style={{
                                fontFamily: "'Dancing Script', cursive",
                                color: '#5a2a0a',
                                padding: '5px 3px',
                                textAlign: 'center',
                                borderTopLeftRadius: '8px',
                                borderBottomLeftRadius: '8px'
                            }}>{entry.rank}</td>
                            <td style={{
                                fontFamily: "'Dancing Script', cursive",
                                color: '#5a2a0a',
                                padding: '5px 3px',
                                textAlign: 'left',
                                fontWeight: entry.isCurrentUser ? 'bold' : 'normal',
                                maxWidth: '120px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }} title={entry.username}>{entry.username}</td>
                            <td style={{
                                fontFamily: "'Dancing Script', cursive",
                                color: '#5a2a0a',
                                padding: '5px 3px',
                                textAlign: 'right',
                                borderTopRightRadius: '8px',
                                borderBottomRightRadius: '8px'
                            }}>{formatScore(entry.score)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination and Info - made more compact */}
            <div style={{ margin: '10px 0' }}>
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                    }}>
                        <Button
                            text="◀"
                            color="#74b9ff"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{ padding: '3px 10px', minWidth: '30px' }}
                        />

                        <span style={{
                            fontFamily: "'Dancing Script', cursive",
                            fontSize: '1rem',
                            color: '#5a2a0a',
                            minWidth: '80px'
                        }}>
                            {currentPage}/{totalPages}
                        </span>

                        <Button
                            text="▶"
                            color="#74b9ff"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{ padding: '3px 10px', minWidth: '30px' }}
                        />
                    </div>
                )}

                <div style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: '0.9rem',
                    color: '#5a2a0a',
                    margin: '5px 0'
                }}>
                    Total Players: {formatScore(totalEntries)}
                </div>
            </div>

            <Button
                text="Back"
                color="#ff6b95"
                onClick={onBack}
                style={{
                    marginTop: '10px',
                    padding: '8px 20px',
                    fontSize: '1rem'
                }}
            />
        </div>
    );
}

function LoginScreen({ onLogin, onSwitchToRegister, onClose }) {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Username and password are required');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/trivia/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: username,
                    password: password
                }),
            });

            const data = await handleApiResponse(response);

            if (data.success) {
                onLogin(data);
                onClose();
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'rgba(255, 245, 230, 0.95)',
                padding: '30px',
                borderRadius: '20px',
                width: '300px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
                <h2 style={{ textAlign: 'center', fontFamily: "'Dancing Script', cursive" }}>Login</h2>

                {error && (
                    <div style={{
                        color: 'red',
                        margin: '0 0 15px 0',
                        padding: '10px',
                        backgroundColor: 'rgba(255, 200, 200, 0.3)',
                        borderRadius: '5px',
                        textAlign: 'center',
                        fontFamily: "'Dancing Script', cursive"
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontFamily: "'Dancing Script', cursive" }}>Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: error ? '1px solid red' : '1px solid #ccc',
                                fontFamily: "'Dancing Script', cursive",
                                fontSize: '1.2rem'
                            }}
                            maxLength={16}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontFamily: "'Dancing Script', cursive" }}>Password:</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: error ? '1px solid red' : '1px solid #ccc',
                                fontFamily: "'Dancing Script', cursive",
                                fontSize: '1.2rem'
                            }}
                            maxLength={16}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            text={isLoading ? "Logging in..." : "Login"}
                            color="#55efc4"
                            type="submit"
                            style={{ flex: 1, marginRight: '10px' }}
                            disabled={isLoading}
                        />
                        <Button
                            text="Close"
                            color="#ff6b6b"
                            onClick={onClose}
                            style={{ flex: 1 }}
                            disabled={isLoading}
                        />
                    </div>
                </form>
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <span
                        style={{
                            color: '#3a86ff',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontFamily: "'Dancing Script', cursive"
                        }}
                        onClick={onSwitchToRegister}
                    >
                        Need an account? Register
                    </span>
                </div>
            </div>
        </div>
    );
}

function RegisterScreen({ onRegister, onSwitchToLogin, onClose }) {
    const [email, setEmail] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords don't match!");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/trivia/api/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: email,
                    username: username,
                    password: password,
                    confirm_password: confirmPassword
                }),
            });

            const data = await handleApiResponse(response);

            if (data.success) {
                onRegister(data);
                onSwitchToLogin();
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'rgba(255, 245, 230, 0.95)',
                padding: '30px',
                borderRadius: '20px',
                width: '300px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
                <h2 style={{ textAlign: 'center', fontFamily: "'Dancing Script', cursive" }}>Register</h2>

                {error && (
                    <div style={{
                        color: 'red',
                        margin: '0 0 15px 0',
                        padding: '10px',
                        backgroundColor: 'rgba(255, 200, 200, 0.3)',
                        borderRadius: '5px',
                        textAlign: 'center',
                        fontFamily: "'Dancing Script', cursive"
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontFamily: "'Dancing Script', cursive" }}>Email:</label>
                        <input
                            id="emailRegister"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: error ? '1px solid red' : '1px solid #ccc',
                                fontFamily: "'Dancing Script', cursive",
                                fontSize: '1.2rem'
                            }}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontFamily: "'Dancing Script', cursive" }}>Username:</label>
                        <input
                            id="usernameRegister"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: error ? '1px solid red' : '1px solid #ccc',
                                fontFamily: "'Dancing Script', cursive",
                                fontSize: '1.2rem'
                            }}
                            maxLength={16}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontFamily: "'Dancing Script', cursive" }}>Password (min 8 chars):</label>
                        <input
                            id="passwordRegister"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: error ? '1px solid red' : '1px solid #ccc',
                                fontFamily: "'Dancing Script', cursive",
                                fontSize: '1.2rem'
                            }}
                            minLength={8}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontFamily: "'Dancing Script', cursive" }}>Confirm Password:</label>
                        <input
                            id="confirmPasswordRegister"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: error ? '1px solid red' : '1px solid #ccc',
                                fontFamily: "'Dancing Script', cursive",
                                fontSize: '1.2rem'
                            }}
                            minLength={8}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            text={isLoading ? "Registering..." : "Register"}
                            color="#55efc4"
                            type="submit"
                            style={{ flex: 1, marginRight: '10px' }}
                            disabled={isLoading}
                        />
                        <Button
                            text="Close"
                            color="#ff6b6b"
                            onClick={onClose}
                            style={{ flex: 1 }}
                            disabled={isLoading}
                        />
                    </div>
                </form>
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <span
                        style={{
                            color: '#3a86ff',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontFamily: "'Dancing Script', cursive"
                        }}
                        onClick={onSwitchToLogin}
                    >
                        Already have an account? Login
                    </span>
                </div>
            </div>
        </div>
    );
}

function HomeScreen({ onNavigate, user, onUserUpdate }) {
    const [showLogin, setShowLogin] = React.useState(false);
    const [showRegister, setShowRegister] = React.useState(false);
    const [authError, setAuthError] = React.useState('');

    const handleLogin = async (loginData) => {
        setShowLogin(false);
        if (onUserUpdate) {
            onUserUpdate(loginData.user);
        }
        onNavigate('game');
    };

    const handleRegister = async (registerData) => {
        setShowRegister(false);
        setShowLogin(true);
    };

    const handlePlayClick = () => {
        if (user) {
            onNavigate('game');
        } else {
            setShowLogin(true);
        }
    };

    return (
        <div style={{
            position: "relative",
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255, 245, 230, 0.9)',
            borderRadius: '20px',
            maxWidth: '400px',
            margin: 'auto',
            marginTop: '60px',
            boxShadow: '0 10px 30px rgba(255, 140, 0, 0.3)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 180, 100, 0.2)'
        }}>
            <Title text="Pokémon Sunset" />

            {showLogin && (
                <LoginScreen
                    onLogin={handleLogin}
                    onSwitchToRegister={() => {
                        setShowLogin(false);
                        setShowRegister(true);
                    }}
                    onClose={() => setShowLogin(false)}
                />
            )}

            {showRegister && (
                <RegisterScreen
                    onRegister={handleRegister}
                    onSwitchToLogin={() => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                    onClose={() => setShowRegister(false)}
                />
            )}

            {authError && (
                <div style={{
                    color: 'red',
                    margin: '0 0 15px 0',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 200, 200, 0.3)',
                    borderRadius: '5px',
                    textAlign: 'center',
                    fontFamily: "'Dancing Script', cursive"
                }}>
                    {authError}
                </div>
            )}

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '30px 0'
            }}>
                <Button
                    text="Play Game"
                    color="#ff8e53"
                    onClick={handlePlayClick}
                    style={{ margin: '10px' }}
                />
                <Button
                    text="Leaderboard"
                    color="#74b9ff"
                    onClick={() => onNavigate('leaderboard')}
                    style={{ margin: '10px' }}
                />
                <Button
                    text="How to Play"
                    color="#55efc4"
                    onClick={() => onNavigate('instructions')}
                    style={{ margin: '10px' }}
                />
                <Button
                    text="Credits"
                    color="#fd79a8"
                    onClick={() => onNavigate('credits')}
                    style={{ margin: '10px' }}
                />
            </div>

            <div style={{
                marginTop: '20px',
                fontFamily: "'Dancing Script', cursive",
                fontSize: '1.3rem',
                color: '#5a2a0a',
                padding: '15px',
                background: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '12px',
                boxShadow: '0 4px 8px rgba(255, 140, 0, 0.1)'
            }}>
                <p style={{fontSize: '1.2rem'}}>Catch the Pokémon before they disappear!</p>
            </div>
        </div>
    );
}

function InstructionsScreen({ onBack }) {
    return (
        <div style={{
            position: "relative",
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255, 245, 230, 0.9)',
            borderRadius: '20px',
            maxWidth: '400px',
            margin: 'auto',
            marginTop: '60px',
            boxShadow: '0 10px 30px rgba(255, 140, 0, 0.3)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 180, 100, 0.2)'
        }}>
            <Title text="How to Play" />
            <div style={{
                textAlign: 'left',
                fontFamily: "Dancing Script",
                margin: '30px 0',
                padding: '0 20px',
                color: '#5a2a0a'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '20px',
                    padding: '12px 20px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 8px rgba(255, 140, 0, 0.1)',
                    transition: 'all 0.3s ease'
                }}>
                    <span style={{ fontSize: '16px', marginRight: '15px' }}>🐭</span>
                    <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        lineHeight: '1.5'
                    }}>Click on Pokemon as they appear to earn points</p>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '20px',
                    padding: '12px 20px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 8px rgba(255, 140, 0, 0.1)',
                    transition: 'all 0.3s ease'
                }}>
                    <span style={{ fontSize: '16px', marginRight: '15px' }}>⏱️</span>
                    <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        lineHeight: '1.5'
                    }}>They disappear after a few seconds</p>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '20px',
                    padding: '12px 20px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 8px rgba(255, 140, 0, 0.1)',
                    transition: 'all 0.3s ease'
                }}>
                    <span style={{ fontSize: '16px', marginRight: '15px' }}>🏆</span>
                    <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        lineHeight: '1.5'
                    }}>Compete for high scores on the leaderboard</p>
                </div>
            </div>
            <Button
                text="Back to Home"
                color="#ff6b95"
                onClick={onBack}
                style={{ marginTop: '20px' }}
            />
        </div>
    );
}

function GameScreen({ score, onScore, onReset, onBack, achievedMilestones, setAchievedMilestones }) {
    const [multiplier, setMultiplier] = React.useState(() => {
        const saved = localStorage.getItem('clickerMultiplier');
        return saved ? Number(saved) : 1;
    });
    const [currentLevel, setCurrentLevel] = React.useState(() => {
        const saved = localStorage.getItem('clickerLevel');
        return saved ? Number(saved) : 1;
    });
    const [xpToNextLevel, setXpToNextLevel] = React.useState(() => {
        const saved = localStorage.getItem('clickerXPToNext');
        return saved ? Number(saved) : 100;
    });
    const [currentXP, setCurrentXP] = React.useState(() => {
        const saved = localStorage.getItem('clickerCurrentXP');
        return saved ? Number(saved) : 0;
    });

    React.useEffect(() => {
        localStorage.setItem('clickerMultiplier', multiplier);
        localStorage.setItem('clickerLevel', currentLevel);
        localStorage.setItem('clickerXPToNext', xpToNextLevel);
        localStorage.setItem('clickerCurrentXP', currentXP);
    }, [multiplier, currentLevel, xpToNextLevel, currentXP]);

    const handleLevelUp = () => {
        if (currentXP >= xpToNextLevel) {
            const newLevel = currentLevel + 1;
            const newMultiplier = multiplier + 0.5;
            const newXPToNext = Math.floor(xpToNextLevel * 1.5);

            onScore(xpToNextLevel * -1);
            setCurrentLevel(newLevel);
            setMultiplier(newMultiplier);
            setXpToNextLevel(newXPToNext);
            setCurrentXP(0);
        }
    };

    const handleManualClick = () => {
        const earnedPoints = multiplier;
        onScore(earnedPoints);
        setCurrentXP(prev => Math.min(prev + earnedPoints, xpToNextLevel));
    };

    const handleResetGame = () => {
        onReset();
        setMultiplier(1);
        setCurrentLevel(1);
        setXpToNextLevel(100);
        setCurrentXP(0);
    };

    const handlePokemonClick = (points) => {
        const earnedPoints = points * multiplier;
        onScore(earnedPoints);
        setCurrentXP(prev => Math.min(prev + earnedPoints, xpToNextLevel));
    };

    return (
        <div style={{
            position: "relative",
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255, 245, 230, 0.9)',
            borderRadius: '20px',
            maxWidth: '400px',
            margin: 'auto',
            marginTop: '60px',
            boxShadow: '0 10px 30px rgba(255, 140, 0, 0.3)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 180, 100, 0.2)'
        }}>
            {/* Progress Bar */}
            <div style={{
                width: '100%',
                height: '30px',
                backgroundColor: '#f5f5f5',
                borderRadius: '10px',
                marginBottom: '20px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${(currentXP / xpToNextLevel) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(to right, #ff8e53, #ff6b95)',
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                }}>
                    Level {currentLevel} ({currentXP}/{xpToNextLevel})
                </div>
            </div>

            <Title text="Pokémon Sunset"/>

            <Score
                score={score}
                achievedMilestones={achievedMilestones}
                setAchievedMilestones={setAchievedMilestones}
            />

            <div style={{margin: '10px 0'}}>
                <span style={{
                    fontFamily: "'Bangers', cursive",
                    fontSize: '1.2rem',
                    color: '#5a2a0a'
                }}>
                    Multiplier: {multiplier}x
                </span>
            </div>

            <Clickable onScore={handlePokemonClick}/>

            <div style={{
                margin: '20px 10px',
                marginBottom: '0px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {/* First Row */}
                <div style={{display: 'flex', marginBottom: '10px'}}>
                    <Button
                        text="Click Me!"
                        color="#ff8e53"
                        onClick={handleManualClick}
                        style={{margin: '0 10px'}}
                    />
                    <Button
                        text="Reset"
                        color="#ff6b6b"
                        onClick={handleResetGame}
                        style={{margin: '0 10px'}}
                    />
                </div>

                {/* Second Row - Now uses XP instead of score */}
                <Button
                    text={`Level Up (${xpToNextLevel})`}
                    color={currentXP >= xpToNextLevel ? "#55efc4" : "#cccccc"}
                    onClick={handleLevelUp}
                    style={{margin: '10px'}}
                    disabled={currentXP < xpToNextLevel}
                />
            </div>

            <Button
                text="Back to Home"
                color="#ff6b95"
                onClick={onBack}
                style={{marginTop: '20px'}}
            />
        </div>
    );
}

function MainApp() {
    const [currentScreen, setCurrentScreen] = React.useState('home');
    const [score, setScore] = React.useState(() => {
        const saved = localStorage.getItem('clickerScore');
        return saved ? Number(saved) : 0;
    });
    const [achievedMilestones, setAchievedMilestones] = React.useState(() => {
        const saved = localStorage.getItem('clickerMilestones');
        return saved ? JSON.parse(saved) : [];
    });
    const [user, setUser] = React.useState(null);
    const [maxScore, setMaxScore] = React.useState(0);
    const [showNewRecord, setShowNewRecord] = React.useState(false);

    // Function to post score to backend
    const postScore = async (currentScore) => {
        if (!user) return;

        try {
            const response = await fetch('/trivia/api/post_score/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                credentials: 'include',
                body: JSON.stringify({
                    score: currentScore
                }),
            });

            const data = await handleApiResponse(response);
            if (data.success) {
                if (data.is_new_record) {
                    setMaxScore(data.new_max_score);
                    setShowNewRecord(true);
                    setTimeout(() => setShowNewRecord(false), 3000);
                }
                // Update user data if needed
                if (data.user) {
                    setUser(data.user);
                }
            }
        } catch (error) {
            console.error('Error posting score:', error);
        }
    };

    // Update handleScore to check for new max score
    const handleScore = (delta) => {
        setScore(prev => {
            const newScore = prev + delta;
            localStorage.setItem('clickerScore', newScore);

            // Check if this is a new max score (only if user is logged in)
            if (user && newScore > maxScore) {
                postScore(newScore);
            }

            return newScore;
        });
    };

    // Update handleUserUpdate to set initial maxScore
    const handleUserUpdate = (userData) => {
        setUser(userData);
        if (userData) {
            setMaxScore(userData.max_score || 0);
        } else {
            setMaxScore(0);
        }
    };

    const handleReset = () => {
        setScore(0);
        setAchievedMilestones([]);
        localStorage.setItem('clickerScore', 0);
        localStorage.setItem('clickerMilestones', JSON.stringify([]));
        localStorage.setItem('clickerMultiplier', 1);
        localStorage.setItem('clickerLevel', 1);
        localStorage.setItem('clickerXPToNext', 100);
        localStorage.setItem('clickerCurrentXP', 0);
    };

    React.useEffect(() => {
        localStorage.setItem('clickerMilestones', JSON.stringify(achievedMilestones));
    }, [achievedMilestones]);

    React.useEffect(() => {
        localStorage.setItem('clickerScore', score);
    }, [score]);

    const navigateTo = (screen) => {
        setCurrentScreen(screen);
    };

    const renderScreen = () => {
        switch (currentScreen) {
            case 'game':
                return <GameScreen
                    score={score}
                    onScore={handleScore}
                    onReset={handleReset}
                    onBack={() => navigateTo('home')}
                    achievedMilestones={achievedMilestones}
                    setAchievedMilestones={setAchievedMilestones}
                />;
            case 'leaderboard':
                return <LeaderboardScreen onBack={() => navigateTo('home')} />;
            case 'instructions':
                return <InstructionsScreen onBack={() => navigateTo('home')} />;
            case 'credits':
                return <CreditsScreen onBack={() => navigateTo('home')} />;
            default:
                return <HomeScreen
                    onNavigate={navigateTo}
                    user={user}
                    onUserUpdate={handleUserUpdate}
                />;
        }
    };

    return (
        <div>
            <Header user={user} onUserUpdate={handleUserUpdate} onNavigate={navigateTo}/>
            {renderScreen()}
        </div>
    );
}

// Render entry point
ReactDOM.render(<MainApp />, document.getElementById("root"));