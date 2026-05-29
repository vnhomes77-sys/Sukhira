import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const SkincareRoutineGuide = ({ season }) => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const getRoutineData = () => {
    if (season === 'winter') {
      return {
        title: '❄️ Winter Skin Barrier Protection Guide',
        desc: 'Cold winds and dry indoor heating strip away moisture. Focus on rich oil-based hydration and barrier recovery.',
        steps: [
          {
            step: 'Step 1: Hydrating Cleansing',
            title: 'Gentle Soap-Free Wash',
            desc: 'Cleanse with lukewarm water using a soap-free milk cleanser to preserve natural facial oils.'
          },
          {
            step: 'Step 2: Hydrating Mist/Toner',
            title: 'Dampen and Prep',
            desc: 'Spray a hydrating mist immediately post-wash. Keeping skin damp helps moisturizers lock in twice as much moisture.'
          },
          {
            step: 'Step 3: Revitalizing Oil Treatment',
            title: 'Rosehip Seed Face Oil',
            desc: 'Apply 2-3 drops of Organic Rosehip Oil. Pressed gently into the skin, it supplies essential lipids and vitamins.'
          },
          {
            step: 'Step 4: Intense Cream Barrier Lock',
            title: 'Ceramide Rich Moisturizing Cream',
            desc: 'Apply a thick layer of Ultra-Rich Barrier Cream to restore the stratum corneum and block dry winter wind.'
          },
          {
            step: 'Step 5: Daily Winter Sunscreen',
            title: 'Daily SPF 40 Protection',
            desc: 'UV rays reflect off winter mists. End your morning routine with a hydrating moisturizing sunscreen.'
          }
        ]
      };
    } else if (season === 'summer') {
      return {
        title: '☀️ Summer Matte & Cooling Routine',
        desc: 'High temperatures and sun exposure cause sweating, sunburns, and clogged pores. Prioritize light gel-textures and strong SPF.',
        steps: [
          {
            step: 'Step 1: Clarifying Cleanse',
            title: 'Mild Sebum Control wash',
            desc: 'Wash away sweat and dirt with a light gel-based face wash to prevent summer acne.'
          },
          {
            step: 'Step 2: Instant Cooling Mist',
            title: 'Cucumber & Rose Water Face Mist',
            desc: 'Spritz throughout the day to reduce skin temperature and rebalance sebum production.'
          },
          {
            step: 'Step 3: Lightweight Hydro-Gel Lock',
            title: 'Oil-Free Gel Moisturizer',
            desc: 'Hydrate without heaviness. A lightweight water gel feeds hydration without clogging active pores.'
          },
          {
            step: 'Step 4: Ultimate UV Shield',
            title: 'Broad Spectrum SPF 50 Matte Gel',
            desc: 'Apply a coin-sized amount of sunscreen. Choose a matte formulation that resists sweat and leaves no white cast.'
          },
          {
            step: 'Step 5: Night Recovery',
            title: 'Pure Soothing Aloe Vera Gel',
            desc: 'After sundown, apply aloe vera gel to cool down flushed cheeks and repair UV damage overnight.'
          }
        ]
      };
    } else {
      return {
        title: '🌧️ Monsoon Anti-Bacterial & Clarifying Guide',
        desc: 'High humidity combined with dirty rainwater triggers fungal infections, oily skin, and sticky hair. Keep it anti-microbial and non-greasy.',
        steps: [
          {
            step: 'Step 1: Anti-Bacterial Cleanse',
            title: 'Tea Tree Oil-Control Foaming Face Wash',
            desc: 'Cleanse with tea tree foam to target bacterial breakouts induced by constant dampness.'
          },
          {
            step: 'Step 2: Purifying Detox (2x Weekly)',
            title: 'Activated Charcoal & Kaolin Clay Mask',
            desc: 'Apply a clay mask to absorb toxic pollutants and clear blackheads trapped by heavy monsoon air.'
          },
          {
            step: 'Step 3: Anti-Fungal Foot Defense',
            title: 'Neem and Tea Tree Foot Cream',
            desc: 'Monsoon waters breed athlete’s foot. Dry feet fully and massage anti-fungal cream between toes daily.'
          },
          {
            step: 'Step 4: Non-Sticky Matte Gel Lock',
            title: 'Oil-Free Matte Hydration Gel',
            desc: 'Lock in moisture with a lightweight matte-finish gel to stay fresh without an oily sheen.'
          },
          {
            step: 'Step 5: Anti-Humidity Hair Shield',
            title: 'Frizz-Control Hair Serum',
            desc: 'Damp air swells hair cuticles. Apply a silicone-free hair serum to seal cuticles and prevent frizzy flyaways.'
          }
        ]
      };
    }
  };

  const data = getRoutineData();

  return (
    <div className="routine-guide-section">
      <h2>{data.title}</h2>
      <p>{data.desc}</p>
      
      <div className="accordion-container">
        {data.steps.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="accordion-item">
              <div className="accordion-header" onClick={() => toggleAccordion(idx)}>
                <span>{item.step}: {item.title}</span>
                <ChevronDown size={18} className={`accordion-icon ${isOpen ? 'open' : ''}`} />
              </div>
              <div className={`accordion-body ${isOpen ? 'open' : ''}`}>
                <p className="routine-step-desc">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkincareRoutineGuide;
