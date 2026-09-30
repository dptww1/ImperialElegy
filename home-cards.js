/* requires mainMapBDIT */

const homeCardTableFR = [
  [1, 'Aux Armes, Citoyens'],
  [6, 'City of Light']
]

const homeCardTableAU1 = [
  [4, 'Kaiserreich'],
  [6, 'Habsburg Dynasty']
];
const homeCardTableAU2 = [
  [2, 'Declare War of Unification if possible, otherwise resolve event'],
  [6, 'Resolve event; ally in Germany if able, else use BDIT']
];
const homeCardTableRU = [
  [3, 'Russo-Turkish Wars'],
  [6, 'God Save the Tsar']
];
const homeCardTableOT = [
  [2, 'Jihad'],
  [6, 'Modernization']
];

const homeCardActions = [
  // GE
  () => m('ul.criteria',
    m('li', 'Stability = 6 and event value < 3 CP?',
      m('ul.resolution',
        m('li', 'Play for CPs'))),
    m('li', 'Bismarck card available, not last card and can/will declare war?',
      m('ul.criteria',
        m('li', 'Standing armies = manpower and (if attacking a player) >= 1 reserve army?',
          m('ul.resolution',
            m('li', 'Play Bismarck to declare war'))),
        m('li', 'German General Staff applicable?',
          m('ul.resolution',
            m('li', 'play German General Staff per below'))),
        m('li', 'Otherwise',
          m('ul.resolution',
            m('li', 'Play next card and put home card back on top of pile'))))),
    m('li', 'Otherwise',
      m('ul.resolution',
        m('li', 'Play German General Staff',
          m('ul.criteria',
            m('li', 'Germany not yet unified?',
              m('ul.resolution',
                m('li', 'Declare War of Unification if able'))),
            m('li', 'Otherwise',
              m('ul.resolution',
                m('li', 'Play as event',
                  m('ul.criteria',
                    m('li', '>= 2 ECs available OR no response or combat cards in discard pile',
                      m('ul.resolution',
                        m('li', 'Choose second option'))),
                    m('li', 'Otherwise',
                      m('ul.resolution',
                        m('li', 'Choose first option, taking highest-value response or combat card')))))))))))),

  // UK
  () => m('ul.criteria',
    m('li', 'Always play Sun Never Sets',
      m('ul.criteria',
        m('li', 'India Unstable?',
          m('ul.resolution',
            m('li', 'Play first option; for each CP',
              m('ul.resolution',
                m('li', 'Fewer than 2 EFs or exactly one space to pacify, build an EF in space that could be pacified'),
                m('li', 'Pacify'),
                m('li', 'Move to pacify'))))),
        m('li', 'Otherwise second option')))),

  // FR
  () => {
    const cityOfLightDrmDr = d6();
    return m('ul.criteria',
      m('li', tableLabel(homeCardTableFR)),
      m('div', tableResolveText(homeCardTableFR, d6())),
      m('li', 'Aux Armes, Citoyens',
        m('ul.resolution',
          m('li', 'Use 1st option if can/would declare war and stability wouldn\'t go < 3'),
          m('li', 'Otherwise if +1 marker in Italy box and able, declare Italian War of Unification instead of event'),
          m('li', 'Otherwise, City of Light'))),
      m('li', 'City of Light',
        m('ul.resolution',
          m('li', '1-3 use that many CPs as DRM 4-6 no CPs spent as DRM'),
          m('ul.resolution',
            m('li', dieIcon(cityOfLightDrmDr), ` => use ${cityOfLightDrmDr < 4 ? `${cityOfLightDrmDr} CP${cityOfLightDrmDr > 1 ? 's' : ''} as DRM` : 'no drm'}`,
              cityOfLightDrmDr < 4
                ? m('ul.resolution',
                    m('li', 'If < 3 CP guarantees City of Light point, don\'t spend more'),
                    m('li', 'Don\'t spend CPs for drm if not possible to reach 4 City of Light points by Turn 7'))
                : null)),
          m('li', 'Roll <= Turn to gain City of Light point',
            m('ul.resolution',
              m('div', dieIcon(d6()), cityOfLightDrmDr < 4 ? ` - 0-${cityOfLightDrmDr} drm` : ' no drm'))))));
  },

  // AU
  () => {
    const bditRoll = d6();
    let turn1BditRoll = d6();
    while (turn1BditRoll > 4) {
      turn1BditRoll = d6();
    }

    return m('ul.criteria',
      m('li', 'Turn 1?',
        m('ul.resolution',
          m('li', 'Play Habsburg Dynasty (per below)'))),
      m('li', 'Otherwise',
        m('ul.resolution',
          m('li', tableLabel(homeCardTableAU1)),
          m('div', tableResolveText(homeCardTableAU1, d6())))),
      m('li', 'Habsburg Dynasty',
        m('ul.resolution',
          m('li', tableLabel(homeCardTableAU2)),
          m('div', tableResolveText(homeCardTableAU2, d6()),
            m('ul.resolution',
              m('li', tableLabel(mainMapBDIT[3])),
              m('div',
                tableResolveText(mainMapBDIT[3], bditRoll),
                bditRoll > 4 ? [' (Turn 1? use ', tableResolveText(mainMapBDIT[3], turn1BditRoll), ' instead)'] : null))))));
  },

  // RU
  () => m('ul.criteria',
    m('li', 'Can/will declare war?',
      m('ul.resolution',
        m('li', tableLabel(homeCardTableRU),
          m('ul.resolution',
            m('div', tableResolveText(homeCardTableRU, d6())))))),
    m('li', 'Otherwise',
      m('ul.resolution', m('li', 'God Save the Tsar, for option 1 prefer army steps, then EC, then forts')))),

  // OT
  () => m('ul.criteria',
    m('li', 'Industry < 3?',
      m('ul.resolution',
        m('li', 'play Modernization'))),
    m('li', 'Otherwise',
      m('ul.resolution',
        m('li', tableLabel(homeCardTableOT)),
        m('div', tableResolveText(homeCardTableOT, d6())))),
    m('li', 'Modernization?',
      m('ul.resolution',
        m('li', 'Bots offer card on 1 if enemy, 1-3 if neutral, 1-5 if ally',
          m('ul.resolution',
            countryAbbrevs
              .filter(abbrev => abbrev !== 'ot')
              .map(abbrev => [ `${abbrev.toUpperCase()} => `, dieIcon(d6()), m('br') ]))))))
];
