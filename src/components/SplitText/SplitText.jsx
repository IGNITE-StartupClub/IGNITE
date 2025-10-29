import { useRef, useEffect, useState } from 'react';

const FreeSplitText = ({
  text,
  className = '',
  delay = 100,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete
}) => {
  const ref = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [gsapLoaded, setGsapLoaded] = useState(false);

  // Load fonts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  // Dynamically import GSAP on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadGSAP = async () => {
      try {
        const gsapModule = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        
        const gsap = gsapModule.gsap || gsapModule.default;
        gsap.registerPlugin(ScrollTrigger);
        
        setGsapLoaded({ gsap, ScrollTrigger });
      } catch (error) {
        console.error('Failed to load GSAP:', error);
      }
    };

    loadGSAP();
  }, []);

  // Custom text splitting function
  const splitText = (text, type) => {
    if (type === 'chars') {
      return text.split('').map((char, index) => (
        <span key={index} className="split-char" style={{ display: 'inline-block' }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ));
    } else if (type === 'words') {
      return text.split(' ').map((word, index) => (
        <span key={index} className="split-word" style={{ display: 'inline-block' }}>
          {word}
          {index < text.split(' ').length - 1 && '\u00A0'}
        </span>
      ));
    }
    return text;
  };

  // Animation effect
  useEffect(() => {
    if (!ref.current || !text || !fontsLoaded || !gsapLoaded) return;

    const { gsap, ScrollTrigger } = gsapLoaded;
    const el = ref.current;

    // Get the split elements
    const elements = el.querySelectorAll(`.split-${splitType.includes('chars') ? 'char' : 'word'}`);
    
    if (elements.length === 0) return;

    const startPct = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
    const sign =
      marginValue === 0
        ? ''
        : marginValue < 0
          ? `-=${Math.abs(marginValue)}${marginUnit}`
          : `+=${marginValue}${marginUnit}`;
    const start = `top ${startPct}%${sign}`;

    // Set initial state
    gsap.set(elements, from);

    // Create animation
    const tween = gsap.to(elements, {
      ...to,
      duration,
      ease,
      stagger: delay / 1000,
      scrollTrigger: {
        trigger: el,
        start,
        once: true,
        fastScrollEnd: true,
        anticipatePin: 0.4
      },
      onComplete: () => {
        onLetterAnimationComplete?.();
      },
      willChange: 'transform, opacity',
      force3D: true
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => {
        if (st.trigger === el) st.kill();
      });
      tween.kill();
    };
  }, [
    text,
    delay,
    duration,
    ease,
    splitType,
    JSON.stringify(from),
    JSON.stringify(to),
    threshold,
    rootMargin,
    fontsLoaded,
    gsapLoaded,
    onLetterAnimationComplete
  ]);

  const style = {
    textAlign,
    overflow: 'hidden',
    display: 'inline-block',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    willChange: 'transform, opacity'
  };

  const classes = `split-parent ${className}`;
  const splitTextContent = gsapLoaded ? splitText(text, splitType) : text;

  const renderTag = () => {
    switch (tag) {
      case 'h1':
        return (
          <h1 ref={ref} style={style} className={classes}>
            {splitTextContent}
          </h1>
        );
      case 'h2':
        return (
          <h2 ref={ref} style={style} className={classes}>
            {splitTextContent}
          </h2>
        );
      case 'h3':
        return (
          <h3 ref={ref} style={style} className={classes}>
            {splitTextContent}
          </h3>
        );
      case 'h4':
        return (
          <h4 ref={ref} style={style} className={classes}>
            {splitTextContent}
          </h4>
        );
      case 'h5':
        return (
          <h5 ref={ref} style={style} className={classes}>
            {splitTextContent}
          </h5>
        );
      case 'h6':
        return (
          <h6 ref={ref} style={style} className={classes}>
            {splitTextContent}
          </h6>
        );
      default:
        return (
          <p ref={ref} style={style} className={classes}>
            {splitTextContent}
          </p>
        );
    }
  };

  return renderTag();
};

export default FreeSplitText;