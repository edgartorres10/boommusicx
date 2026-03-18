/**
 * BoomMusicX - Feed Musical
 * Script principal para funcionalidades interativas
 */

// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Inicializa todas as funcionalidades da aplicação
 */
function initializeApp() {
    const feed = document.querySelector('.feed');
    const cards = document.querySelectorAll('.music-card');
    const dots = document.querySelectorAll('.dot');
    const players = document.querySelectorAll('.spotify-player iframe');
    
    // Configurar observadores de interseção para players
    setupPlayerVisibility(players);
    
    // Configurar scroll spy para dots
    setupScrollSpy(feed, cards, dots);
    
    // Configurar clique nos dots
    setupDotsNavigation(dots, cards);
    
    // Configurar efeitos de hover nos cards
    setupCardEffects(cards);
    
    // Configurar swipe touch para mobile
    setupTouchSwipe(feed, cards);
    
    console.log('BoomMusicX inicializado com sucesso! 🎧');
}

/**
 * Gerencia visibilidade dos players para economizar recursos
 * Pausa players que não estão visíveis
 */
function setupPlayerVisibility(players) {
    // Configuração do Intersection Observer
    const observerOptions = {
        root: null, // viewport
        threshold: 0.5 // 50% visível
    };
    
    const playerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const player = entry.target;
            const iframeSrc = player.src;
            
            if (entry.isIntersecting) {
                // Player está visível - ativar
                console.log('Player visível:', player.title);
                
                // Recarregar iframe para reproduzir (se necessário)
                if (iframeSrc.includes('spotify.com')) {
                    // Pequeno truque para garantir que o player esteja ativo
                    player.src = iframeSrc;
                }
            } else {
                // Player não está visível - "pausar" removendo o src
                console.log('Player oculto - economia de recursos:', player.title);
                
                // Salvar src atual e limpar para economizar recursos
                if (iframeSrc && iframeSrc.includes('spotify.com')) {
                    player.dataset.src = iframeSrc;
                    player.src = '';
                }
            }
        });
    }, observerOptions);
    
    // Observar cada player
    players.forEach(player => {
        playerObserver.observe(player);
        
        // Restaurar src quando necessário
        const checkVisibility = () => {
            if (player.dataset.src && isElementInViewport(player)) {
                player.src = player.dataset.src;
                delete player.dataset.src;
            }
        };
        
        // Verificar a cada scroll
        window.addEventListener('scroll', checkVisibility);
    });
}

/**
 * Verifica se um elemento está visível na viewport
 */
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Configura scroll spy para atualizar dots ativos
 */
function setupScrollSpy(feed, cards, dots) {
    // Opções do Intersection Observer para os cards
    const observerOptions = {
        root: feed,
        threshold: 0.5 // 50% do card visível
    };
    
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Card está ativo - atualizar dots
                const index = entry.target.dataset.index;
                updateActiveDot(index, dots);
                
                // Adicionar classe active ao card
                cards.forEach(card => card.classList.remove('active-card'));
                entry.target.classList.add('active-card');
                
                console.log(`Card ${index} ativo`);
            }
        });
    }, observerOptions);
    
    // Observar cada card
    cards.forEach(card => cardObserver.observe(card));
    
    // Também atualizar no scroll manual
    feed.addEventListener('scroll', () => {
        const scrollPosition = feed.scrollTop;
        const cardHeight = cards[0]?.offsetHeight || 0;
        const activeIndex = Math.round(scrollPosition / cardHeight);
        
        if (activeIndex >= 0 && activeIndex < dots.length) {
            updateActiveDot(activeIndex, dots);
        }
    });
}

/**
 * Atualiza o dot ativo
 */
function updateActiveDot(index, dots) {
    dots.forEach((dot, i) => {
        if (i == index) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

/**
 * Configura navegação pelos dots
 */
function setupDotsNavigation(dots, cards) {
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            // Scroll suave até o card correspondente
            cards[index].scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Feedback tátil (vibração) em dispositivos móveis
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
            
            console.log(`Navegando para card ${index}`);
        });
    });
}

/**
 * Configura efeitos especiais nos cards
 */
function setupCardEffects(cards) {
    cards.forEach(card => {
        // Efeito de brilho ao passar o mouse
        card.addEventListener('mouseenter', () => {
            const cover = card.querySelector('.cover-container');
            if (cover) {
                cover.style.animation = 'glowPulse 1.5s ease-in-out infinite';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            const cover = card.querySelector('.cover-container');
            if (cover) {
                cover.style.animation = '';
            }
        });
    });
}

/**
 * Configura suporte a swipe touch em dispositivos móveis
 */
function setupTouchSwipe(feed, cards) {
    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50;
    
    feed.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    feed.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeDistance = touchEndY - touchStartY;
        const currentScrollIndex = Math.round(feed.scrollTop / cards[0].offsetHeight);
        
        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance < 0 && currentScrollIndex < cards.length - 1) {
                // Swipe para cima - próximo card
                cards[currentScrollIndex + 1].scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else if (swipeDistance > 0 && currentScrollIndex > 0) {
                // Swipe para baixo - card anterior
                cards[currentScrollIndex - 1].scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }
}

/**
 * Função utilitária para atualizar conteúdo dos cards
 * Facilita a manutenção - basta chamar esta função com novos dados
 */
function updateCardContent(cardIndex, newData) {
    const card = document.querySelector(`.music-card[data-index="${cardIndex}"]`);
    if (!card) return;
    
    // Atualizar capa
    if (newData.coverUrl) {
        const coverImg = card.querySelector('.cover-image');
        coverImg.src = newData.coverUrl;
        coverImg.alt = `Capa - ${newData.title}`;
    }
    
    // Atualizar título e artista
    if (newData.title) {
        card.querySelector('.music-title').textContent = newData.title;
    }
    
    if (newData.artist) {
        card.querySelector('.music-artist').textContent = newData.artist;
    }
    
    // Atualizar player Spotify
    if (newData.spotifyEmbedUrl) {
        const iframe = card.querySelector('.spotify-player iframe');
        iframe.src = newData.spotifyEmbedUrl;
    }
    
    // Atualizar links dos botões
    if (newData.spotifyListenUrl) {
        const listenBtn = card.querySelector('.spotify-btn');
        listenBtn.href = newData.spotifyListenUrl;
    }
    
    if (newData.spotifySaveUrl) {
        const saveBtn = card.querySelector('.save-btn');
        saveBtn.href = newData.spotifySaveUrl;
    }
    
    console.log(`Card ${cardIndex} atualizado com sucesso!`);
}

// Exemplo de uso da função updateCardContent:
/*
updateCardContent(0, {
    coverUrl: 'https://i.scdn.co/image/nova-imagem.jpg',
    title: 'Nova Música',
    artist: 'Novo Artista',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/track/novo-id',
    spotifyListenUrl: 'https://open.spotify.com/track/novo-id',
    spotifySaveUrl: 'https://open.spotify.com/track/novo-id?si=save'
});
*/

// Registrar evento quando a página estiver prestes a ser descarregada
window.addEventListener('beforeunload', () => {
    // Limpeza de recursos se necessário
    console.log('BoomMusicX finalizado.');
});