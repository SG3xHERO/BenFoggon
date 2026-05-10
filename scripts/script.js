/**
 * Ben Foggon Portfolio — Anime.js Powered Interactions
 * Canvas particles · Preloader · Hero · Scroll reveals · Nav
 * Same design system as Project Networks
 */
(function () {
  'use strict';

  /* =====================================================
     UTILITIES
     ===================================================== */
  function splitChars(el) {
    var text = el.textContent;
    el.innerHTML = text.split('').map(function (c) {
      return c === ' '
        ? '<span class="char" style="display:inline-block;width:0.3em">&nbsp;</span>'
        : '<span class="char">' + c + '</span>';
    }).join('');
    return el.querySelectorAll('.char');
  }

  /* =====================================================
     PARTICLE CANVAS
     ===================================================== */
  function initParticles() {
    var canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var W, H, particles = [];
    var MAX_DIST = 140;
    var COUNT = window.innerWidth < 768 ? 40 : 80;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function Particle() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.r  = Math.random() * 2 + 1;
      this.alpha = Math.random() * 0.4 + 0.1;
    }

    Particle.prototype.update = function () {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
    };

    resize();
    window.addEventListener('resize', function () {
      resize();
      particles = Array.from({ length: COUNT }, function () { return new Particle(); });
    });

    particles = Array.from({ length: COUNT }, function () { return new Particle(); });

    function draw() {
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.update();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, ' + p.alpha + ')';
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            var strength = (1 - dist / MAX_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(168, 85, 247, ' + strength + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    draw();
  }

  /* =====================================================
     PRELOADER
     ===================================================== */
  function initPreloader() {
    var preloader = document.getElementById('preloader');
    var fill      = document.querySelector('.preloader-fill');
    var label     = document.querySelector('.preloader-label');
    var letters   = document.querySelectorAll('.preloader-logo span');

    // Animate B and F letters
    anime({
      targets: letters,
      opacity: [0, 1],
      translateY: [30, 0],
      delay: anime.stagger(150),
      easing: 'easeOutExpo',
      duration: 700,
      complete: function () {
        anime({ targets: label, opacity: [0, 1], duration: 400, easing: 'easeOutQuad' });
      }
    });

    // Animate progress bar
    var progress = 0;
    var interval = setInterval(function () {
      progress += Math.random() * 18 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        if (fill) fill.style.width = '100%';
        setTimeout(hidePreloader, 400);
      } else {
        if (fill) fill.style.width = progress + '%';
      }
    }, 80);

    function hidePreloader() {
      if (!preloader) return;
      preloader.classList.add('hidden');
      setTimeout(function () {
        preloader.style.display = 'none';
        initHero();
        initOrbAnimation();
      }, 650);
    }

    // Fallback: hide after 3.5s regardless
    setTimeout(function () {
      if (preloader && !preloader.classList.contains('hidden')) {
        hidePreloader();
      }
    }, 3500);
  }

  /* =====================================================
     GRADIENT ORB ANIMATION
     ===================================================== */
  function initOrbAnimation() {
    var orbs = document.querySelectorAll('.gradient-orb');

    orbs.forEach(function (orb, i) {
      anime({ targets: orb, opacity: [0, 0.25], duration: 1500, easing: 'easeOutQuad' });

      anime({
        targets: orb,
        translateX: [{ value: (i % 2 === 0 ? 60 : -60), duration: 8000 + i * 2000 }, { value: 0, duration: 8000 + i * 2000 }],
        translateY: [{ value: (i % 2 === 0 ? -40 : 50), duration: 8000 + i * 2000 }, { value: 0, duration: 8000 + i * 2000 }],
        scale: [{ value: 1.1, duration: 8000 + i * 2000 }, { value: 0.9, duration: 8000 + i * 2000 }],
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate',
        delay: i * 2000
      });
    });

    // Orb 3 follows mouse loosely
    var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    var orbX = mouseX, orbY = mouseY;
    var orb3 = document.querySelector('.orb-3');

    document.addEventListener('mousemove', function (e) { mouseX = e.clientX; mouseY = e.clientY; });

    (function trackMouse() {
      if (orb3) {
        orbX += (mouseX - orbX) * 0.03;
        orbY += (mouseY - orbY) * 0.03;
        orb3.style.left = orbX + 'px';
        orb3.style.top  = orbY + 'px';
      }
      requestAnimationFrame(trackMouse);
    })();
  }

  /* =====================================================
     HERO ENTRANCE
     ===================================================== */
  function initHero() {
    var line2 = document.querySelector('.split-text');
    if (line2) splitChars(line2);

    var tl = anime.timeline({ easing: 'easeOutExpo' });

    tl.add({ targets: '.nav-link', opacity: [0, 1], translateY: [-15, 0], delay: anime.stagger(60), duration: 600 }, 0);
    tl.add({ targets: '#hero-badge', opacity: [0, 1], scale: [0.8, 1], duration: 500, easing: 'easeOutBack' }, 300);
    tl.add({ targets: '.hero-line-1', opacity: [0, 1], translateY: [20, 0], duration: 600 }, 500);
    tl.add({ targets: '.hero-line-2 .char', opacity: [0, 1], translateY: [60, 0], rotateX: [-90, 0], delay: anime.stagger(35), duration: 700, easing: 'easeOutBack' }, 650);
    tl.add({ targets: '#hero-sub',  opacity: [0, 1], translateY: [20, 0], duration: 600 }, 1300);
    tl.add({ targets: '#hero-desc', opacity: [0, 1], translateY: [20, 0], duration: 600 }, 1450);
    tl.add({ targets: '#hero-actions', opacity: [0, 1], translateY: [20, 0], duration: 600 }, 1600);
    tl.add({ targets: '#hero-stats', opacity: [0, 1], translateY: [15, 0], duration: 600 }, 1750);
  }

  /* =====================================================
     NAVIGATION
     ===================================================== */
  function initNav() {
    var nav    = document.getElementById('main-nav');
    var toggle = document.getElementById('nav-toggle');
    var links  = document.getElementById('nav-links');

    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 40);

      var btt = document.getElementById('backToTop');
      if (btt) btt.classList.toggle('visible', window.scrollY > 400);

      updateActiveNav();
    }, { passive: true });

    if (toggle && links) {
      toggle.addEventListener('click', function () {
        toggle.classList.toggle('active');
        links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', links.classList.contains('open'));
      });

      links.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
          toggle.classList.remove('active');
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          var offset = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: offset, behavior: 'smooth' });
        }
      });
    });

    var btt = document.getElementById('backToTop');
    if (btt) {
      btt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }
  }

  function updateActiveNav() {
    var scrollPos = window.scrollY + 120;
    document.querySelectorAll('section[id], header[id]').forEach(function (section) {
      var top    = section.offsetTop;
      var bottom = top + section.offsetHeight;
      var id     = section.getAttribute('id');
      var link   = document.querySelector('.nav-link[href="#' + id + '"]');
      if (link && scrollPos >= top && scrollPos < bottom) {
        document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');
      }
    });
  }

  /* =====================================================
     SCROLL REVEAL
     ===================================================== */
  function initScrollReveal() {
    // Section fade-in
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          sectionObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.reveal-section').forEach(function (el) { sectionObs.observe(el); });

    // Project cards stagger
    var cardObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var cards = entry.target.querySelectorAll('.pcard');
          anime({
            targets: cards,
            opacity: [0, 1],
            translateY: [40, 0],
            scale: [0.95, 1],
            delay: anime.stagger(140),
            duration: 700,
            easing: 'easeOutBack',
            complete: function () {
              cards.forEach(function (c) { c.classList.add('visible'); });
            }
          });
          cardObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card-grid').forEach(function (el) { cardObs.observe(el); });

    // Contact cards stagger
    var contactObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var cards = entry.target.querySelectorAll('.contact-card');
          anime({
            targets: cards,
            opacity: [0, 1],
            translateY: [24, 0],
            delay: anime.stagger(120),
            duration: 650,
            easing: 'easeOutBack',
            complete: function () {
              cards.forEach(function (c) { c.classList.add('visible'); });
            }
          });
          contactObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.contact-grid').forEach(function (el) { contactObs.observe(el); });

    // About feature list stagger
    var featureObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          anime({
            targets: entry.target.querySelectorAll('.feature-item'),
            opacity: [0, 1],
            translateX: [-20, 0],
            delay: anime.stagger(100),
            duration: 600,
            easing: 'easeOutExpo'
          });
          anime({
            targets: entry.target.querySelectorAll('.about-meta-row, .music-player-card'),
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(100, { start: 400 }),
            duration: 600,
            easing: 'easeOutExpo'
          });
          featureObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.about-grid').forEach(function (el) { featureObs.observe(el); });

    // Stats counter
    var statsObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          initCounters();
          statsObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    var statsEl = document.querySelector('.hero-stats');
    if (statsEl) statsObs.observe(statsEl);

    // CTA section
    var ctaObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          anime({
            targets: entry.target.querySelectorAll('.cta-title, .cta-desc, .cta-actions'),
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(120),
            duration: 700,
            easing: 'easeOutExpo'
          });
          ctaObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.cta-inner').forEach(function (el) { ctaObs.observe(el); });
  }

  /* =====================================================
     COUNTERS
     ===================================================== */
  function initCounters() {
    document.querySelectorAll('.counter').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      anime({
        targets: el,
        innerHTML: [0, target],
        round: 1,
        duration: 1800,
        easing: 'easeOutExpo'
      });
    });
  }

  /* =====================================================
     CARD TILT (subtle)
     ===================================================== */
  function initTilt() {
    document.querySelectorAll('.pcard').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width  - 0.5;
        var y = (e.clientY - rect.top)  / rect.height - 0.5;
        card.style.transform = 'translateY(-4px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* =====================================================
     RIPPLE ON BUTTONS
     ===================================================== */
  function initRipple() {
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.style.cssText = [
          'position:absolute',
          'border-radius:50%',
          'transform:scale(0)',
          'animation:ripple-anim 0.6s linear',
          'background:rgba(255,255,255,0.25)',
          'width:100px',
          'height:100px',
          'left:' + (e.clientX - rect.left - 50) + 'px',
          'top:'  + (e.clientY - rect.top  - 50) + 'px',
          'pointer-events:none'
        ].join(';');
        btn.appendChild(ripple);
        setTimeout(function () { ripple.remove(); }, 700);
      });
    });

    // Inject ripple keyframe
    if (!document.getElementById('ripple-style')) {
      var style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = '@keyframes ripple-anim { to { transform: scale(4); opacity: 0; } }';
      document.head.appendChild(style);
    }
  }

  /* =====================================================
     INIT
     ===================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initParticles();
    initPreloader();
    initNav();
    initScrollReveal();
    initTilt();
    initRipple();
  });

})();
