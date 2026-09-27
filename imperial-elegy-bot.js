/**
 * - UK Balance of Power when war is declared
 * - should really put text in JSON and then run through rendering templates
 */
const d6 = () => Math.floor(Math.random() * 6) + 1;

const dieIcon = n => m('span.die', ['\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'][n - 1]);

const countryNames = ['Germany', 'United Kingdom', 'France', 'Austria', 'Russia', 'Ottoman Empire'];
const countryAbbrevs = ['ge', 'uk', 'fr', 'au', 'ru', 'ot'];
const countryAdjectives = [' German', ' British', ' French', 'n Austrian', ' Russian', ' Ottoman'];
const strategicRival = ['1st player in turn order controlling or allied with GE unification spaces', null, null, null, 'Ottoman Empire', null];

const tableLabel = table => table.map((elt, idx) => {
  const minRange = idx == 0 ? 1 : table[idx - 1][0] + 1;
  const maxRange = elt[0];
  const range = minRange === maxRange ? minRange : `${minRange}-${maxRange}`;

  return `${range} ${elt[1]}`
}).join(", ");

const tableResolveText = (table, dr) => [
  dieIcon(dr),
  ' => ',
  table.find(elt => dr <= elt[0])[1]
];

const allianceTable = [
  [2, 'Triple Alliance'],
  [4, 'Neutral'],
  [6, 'Triple Entente']
];

const auExcessCpActions = [
  [2, 'Incorporate a minor power controlling 2+ keys'],
  [4, 'Grant Rights'],
  [6, 'Attempt to grant full citizenship']
];

const brBalanceOfPower = [ // response to war declaration
  [2, 'Play Balance of Power'],
  [6, 'Britain doesn\'t intervene']
];

const priority2dr56step3 = [
  [3, 'Refit reduced naval units, then build new naval units'],
  [5, 'Build a fort'],
  [6, 'Build an EC']
];

const mainMapBDIT = [ // index by country idx
  [ // GE
    [4, 'Germany'],
    [6, 'Low Countries']
  ],
  [ // UK
    [6, 'Low Countries']   // TODO: better label/resolve for single entry; it's silly to roll a die for constant results
  ],
  [ // FR
    [3, 'Italy'],
    [6, 'Low Countries']
  ],
  [ // AU
    [2, 'Germany'],
    [4, 'Italy'],
    [6, 'Balkans (not on Turn 1)']
  ],
  [ // RU
    [6, 'Balkans']
  ],
  [ // OT
    [6, 'Diplomacy/Ally Egypt if able, else Balkans']
  ]
];

const subMapBDIT = [
  [ // GE
    [4, 'Africa'],
    [6, 'Pacific, Oman, & Aden']
  ],
  [ // UK
    [2, 'Africa'],
    [4, 'Great Game'],
    [6, 'Pacific, Oman, & Aden']
  ],
  [ // FR
    [4, 'Africa'],
    [6, 'Pacific, Oman, & Aden']
  ],
  [ // AU (none!)
  ],
  [ // RU
    [5, 'Great Game'],
    [6, 'Pacific, Oman, & Aden']
  ],
  [ // OT
    [3, 'Africa'],
    [6, 'Great Game']
  ]
];

const priority1Actions = [
  { text: 'Attack rebels/build/move units to attack rebels' },
  { text: 'Event indicated by card\'s bot box, unless spending CPs would provide more value' },
  { text: 'Industrialize (only with 1/2 CP card if auto-industrialize), not on turn 7' },
  { who: 'ge', text: 'Build army steps' },
  { who: 'uk', text: 'Build dreadnoughts' },
  { text: 'WTT >= 3: Build army steps' },
  { text: '6+ buildable army steps: Build army steps' }
];

let state = {
  steps: []
};

//========================================================================
const actionApplies = (actionObj, abbrev) =>
      !actionObj.who
        || (typeof actionObj.who === 'string' && abbrev === actionObj.who)
        || (Array.isArray(actionObj.who) && actionObj.who.indexOf(abbrev) >= 0);

//========================================================================
const numericParamOrDefault = (paramName, defaultValue) => {
  const params = new URL(window.location).searchParams;
  if (!params) {
    return defaultValue;
  }

  return (params.get(paramName) && Number(params.get(paramName))) || defaultValue;
};

//========================================================================
const resolve = idx => {
  const abbrev = countryAbbrevs[idx];

  state.steps = [
    domCountryName(idx),
    domHomeCard(idx)
  ];

  state.steps.push(m('details.step', { open: true },
    m('summary', 'Priority 1'),
    m('ul.resolution',
      priority1Actions.filter(o => actionApplies(o, abbrev))
      .map(o => m('li', o.text)))));


  // As a debugging aid, can use these url parameters to force Priority 2 initial dieroll.
  priority2dr1 = numericParamOrDefault('dr1', d6());
  priority2dr2 = numericParamOrDefault('dr2', d6());

  state.steps.push(m('details.step',
    m('summary', 'Priority 2:', dieIcon(priority2dr1), ' ', dieIcon(priority2dr2)),

    // On double 1s or 6s, surprise war is possible (except for UK)
    priority2dr1 === priority2dr2
      ? domSurpriseWarMaybe(idx, priority2dr1)
      : domPriority2die(idx, priority2dr1)
  ));

  return false; // prevent form submit!
};

//========================================================================
const domCountryButtonPanel = () =>
  m('form',
    m('.country-button-panel',
      countryAbbrevs.map(
        (elt, idx) => m(`button.country.country-${elt}`,
          {
            onclick: () => resolve(idx)
          },
          elt.toUpperCase()))));

//========================================================================
const domCountryName = idx =>
      m('.country-name.centered',
        m(`button.country-${countryAbbrevs[idx]}.centered`,
          countryNames[idx]));

//========================================================================
const domExcessCPActions = countryIdx => {
  const excessSteps = [
    m('ul.resolution',
      m('li', 'Spend 1 CP to pacify, else move an EF to a space it could pacify'),
      m('li', 'Build army steps'))
  ];

  if (countryIdx === 3) {
    excessSteps.push(
      m('ul.criteria',
        m('li', 'At least 3 CP left?'),
          m('ul.resolution',
            m('li', tableLabel(auExcessCpActions)),
            m('div', tableResolveText(auExcessCpActions, d6())))))
  }

  excessSteps.push(
  m('ul.criteria',
    m('li', 'Receiving Naval Arms Race event benefit?',
      m('ul.resolution',
        m('li', 'Build naval units')))));

  if (countryIdx === 1 || countryIdx === 2 || countryIdx == 4) {
    excessSteps.push(
    m('ul.resolution',
      m('li', 'Build new reduced naval units if would increase Power Projection')));
  }

  excessSteps.push(domExcessCPActionsStep6(countryIdx));

  return excessSteps;
};

//========================================================================
const domExcessCPActionsStep6 = countryIdx => {
  const excessSteps = [];

  const rival = strategicRival[countryIdx];
  if (rival) {
    excessSteps.push(
      m('ul.criteria',
        m('li', `Allied to ${rival}?`,
          m('ul.resolution',
            m('li', 'Spend half remaining CP to add Neutral influence to rival or themselves, whoever\'s closest')))));
  }

  excessSteps.push(
  m('ul.criteria',
    m('li', 'Committed to an alliance and other alliance has more major powers?',
      m('ul.resolution',
        m('li', 'Spend all remaining CP to influence neutral power where bot\'s alliance isn\'t currently highest (IT last)')))));

  const suddenDr = d6();
  excessSteps.push(
    m('ul.criteria',
      m('li', 'Has 0 influence of their current alliance?',
        m('ul.resolution',
          m('li', '1-3 add remaining CP to current alliance on their own track'),
          m('div', dieIcon(suddenDr), ' => ', (suddenDr <= 3 ? 'yes' : 'no'))))));

  powerDr = d6();
  excessSteps.push(
  m('ul.resolution',
    m('li', 'Choose country:', countryAbbrevs.map((a, i) => `${i + 1} ${a.toUpperCase()}`).join(' '),
      m('div', dieIcon(powerDr), ' => ', countryNames[powerDr - 1])),
    m('li', 'Choose alliance:', tableLabel(allianceTable),
      m('div', tableResolveText(allianceTable, d6())),
      m('ul.resolution',
        m('li', `Don't influence ally to leave alliance${rival ? ' (except strategic rival)' : ''}`),
        m('li', 'Don\t influence a neutral power to join the opposite alliance')))));

  return excessSteps;
}

//========================================================================
const domForm = {
  view: function() {
    return [
      domCountryButtonPanel(),
      m('hr'),
      domSteps()
    ]
  }
};

//========================================================================
const domHomeCard = idx =>
      m('details.step.home-card',
        m('summary', 'Home Card?'),
        homeCardActions[idx]());

//========================================================================
const domPriority2die = (countryIdx, dr) => {
  const curMainMapBDIT = mainMapBDIT[countryIdx];
  const curSubMapBDIT  = subMapBDIT[countryIdx];

  switch (dr) {
  case 1:
    if (countryIdx === 3) {
      return m('.step',
        m('ul.criteria',
          m('li', 'AU automatically switches to dr ', dieIcon(3)),
          domPriority2die(countryIdx, 3)));

    } else {
      if (countryIdx === 0) {
        return m('.step',
          m('ul.criteria',
            m('li', 'GE before unification switches to dr ', dieIcon(3)),
            domPriority2die(countryIdx, 3)));
      }

      const dr1Steps = [];

      dr1Steps.push(m('ul.resolution',
        m('li', 'Spend 1 CP to pacify, else move an EF to a space it could pacify'),
        countryIdx !== 3 // AU has no submap targets
          ? m('li', 'Place influence in Asia or Africa based on BDIT',
              m('ul.resolution',
                m('li', tableLabel(curSubMapBDIT),
                  m('div', tableResolveText(curSubMapBDIT, d6())),
                  m('ul.resolution',
                    m('li', 'Tiebreak: where control increases Power Projection'),
                    m('li', 'In Africa, Ethiopia last')))))
          : null,
        m('li', 'Build or move an EF to a space it could pacify; build instead if >= 1 CP left'),
        m('li', 'Spend 2 CP to pacify'),
        m('li', 'Excess CP Actions:',
          domExcessCPActions(countryIdx))));

      return dr1Steps;
    }

  case 2:
    if (countryIdx == 1) {
      return m('.step',
        m('ul.criteria',
          m('li', 'UK automatically switches to dr ', dieIcon(1))),
        domPriority2die(countryIdx, 1));
    }
    else if (countryIdx == 2) {
      return m('.step',
        m('ul.criteria',
          m('li', 'FR on Turns 1-4? Switch to dr ', dieIcon(1),
            domPriority2die(countryIdx, 1)),
          m('li', 'Otherwise use dr ', dieIcon(3),
            domPriority2die(countryIdx, 3))));
    }

  case 3:
    return m('.step',
      m('ul.criteria',
        m('li', 'Play as event, unless any of the following are true:',
          m('ul.resolution',
            m('li', 'It hurts the bot or one of the bot\'s allies'),
            m('li', 'It helps one of the bot\'s enemies'),
            m('li', 'It\'s a 3-4 CP event that doesn\'t help them specifically'),
            m('li', 'The event is worth less than the CP value'))),
        m('li', 'Excess CP Actions:',
          domExcessCPActions(countryIdx))));

  case 4:
    let bditRoll = d6();
    let turn1BditRoll = d6();
    while (countryIdx === 3 && turn1BditRoll > 4) {
      turn1BditRoll = d6();
    }

    return m('.step',
      m('ul.resolution',
        m('li', 'Spend 1 CP to pacify, or move an EF to a space it could pacify'),
        m('li', `Gain an alliance with a minor power with a${countryAdjectives[countryIdx]} Diplomacy marker`),
        m('li', 'Place a Diplomacy marker on the main map based on BDIT',
          m('ul.resolution',
            m('li', tableLabel(curMainMapBDIT),
              m('div', tableResolveText(curMainMapBDIT, bditRoll)),
              countryIdx === 3 && bditRoll > 4
                ? m('div', 'If Turn 1: ', tableResolveText(curMainMapBDIT, turn1BditRoll))
                : null))),
        countryIdx === 1 || countryIdx === 2
          ? [
              m('li', 'American Civil War in effect?',
                m('ul.resolution',
                  m('li', `Place a${countryAdjectives[countryIdx]} Diplomacy marker in South space`),
                  m('li', 'Otherwise move a naval unit to the South space if cost < 2 CP'))),
              m('li', `Place a${countryAdjectives[countryIdx]} Diplomacy marker in Egypt; remove other Diplomacy there first if enough CPs to place`)
            ]
          : null,
        m('li', 'Remove a Diplomacy marker on the main map based on BDIT',
          m('ul.resolution',
            m('li', tableLabel(curMainMapBDIT),
              m('div', tableResolveText(curMainMapBDIT, d6()))))),
        countryIdx === 4 || countryIdx === 5
          ? m('li', 'If no RU-OT alliance:',
              m('ul.resolution',
                m('li', `Remove a${countryAdjectives[9 - countryIdx]} Alliance marker in Balkans, or Persia if none`)))
          : null,
        m('li', 'Excess CP Actions:',
          domExcessCPActions(countryIdx))));


  case 5: // fall through
  case 6:
    let dieroll = d6();
    return m('.step',
      m('ul.resolution',
        m('li', 'Spend 1 CP to pacify, or move an EF to a space it could pacify'),
        m('li', 'Build army steps'),
        m('li', tableLabel(priority2dr56step3),
          m('ul.resolution',
            m('li', tableResolveText(priority2dr56step3, dieroll)))),
        m('li', 'Excess CP Actions:',
          domExcessCPActions(countryIdx))));
  }
};

//========================================================================
const domSteps = () => m('.centered', state.steps);

//========================================================================
const domSurpriseWarMaybe = (idx, dr) => {
  if (idx === 1) {
    return m('ul.resolution',
      m('li', 'Build army steps'),
      m('li', 'Excess CP Actions:',
        domExcessCPActionsStep6(idx)));
  }

  if (dr === 1 || dr === 6) {
    const balanceOfPowerDr = d6();

    return m('ul.criteria',
      m('li', 'Suprise War if:',
        m('ul.resolution',
          idx === 0 ? m('li', 'Not GE before unification') : null,
          m('li', 'Can use entire card to declare war'),
          m('li', 'Card >= 2 CPs'),
          m('li', 'Home card has already been played'),
          m('li', 'Shares land border with potential target'),
          m('li', 'WTT < 3'),
          m('li', 'For War of Conquest, WTT < 2, resulting stability >= 3'),
          m('li', 'Declare war: Liberation > Unification > Conquest'),
          m('li', 'UK Balance of Power home card available?',
            m('ul.criteria',
              m('li', tableLabel(brBalanceOfPower)),
              m('div', tableResolveText(brBalanceOfPower, balanceOfPowerDr)),
              balanceOfPowerDr < 3
                ? m('ul.resolution',
                    m('li', 'Neutrals join on 1-3',
                      m('ul.resolution',
                        countryNames
                          .filter(n => n !== countryNames[1] && n !== countryNames[idx])
                          .map(n => [n, d6()])
                          .map(([n, dr]) => m('li', `${n}: `, dieIcon(dr), ' => ', (dr < 4 ? 'offers to join' : 'declines'))))))
                : null)))),
      m('li', 'No Surprise War?',
        m('ul.resolution',
          m('li', 'Build army steps'),
          m('li', 'Excess CP Actions:',
            domExcessCPActionsStep6(idx)))));
  }

  return m('ul.resolution',
    m('li', 'Build army steps'),
    m('li', 'Excess CP Actions:',
      domExcessCPActionsStep6(idx)));
};

//========================================================================
m.mount(document.getElementById('mainDiv'), domForm);
