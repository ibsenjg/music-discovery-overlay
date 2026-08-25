import { compileCandidateQueries } from '../src/shared/intent';
import { ALL_CHIPS } from '../src/shared/ontology';
import { parseWithRules, RulesProvider } from '../src/providers/rulesProvider';

describe('guided discovery provider', () => {
  it('parses bilingual instruments and preserves explicit alternatives', () => {
    const intent = parseWithRules(
      'Quiero artistas con piano, trompeta o violín',
      'es',
    );
    expect(intent.target).toBe('artist');
    expect(intent.mode).toBe('guided');
    expect(intent.traitGroups).toContainEqual(
      expect.objectContaining({
        category: 'instrument',
        operator: 'OR',
        values: ['piano', 'trumpet', 'violin'],
      }),
    );
  });

  it.each(['double bass', 'contrabajo'])(
    'does not broaden %s into generic bass',
    (request) => {
      const instruments = parseWithRules(request, 'en').traitGroups.filter(
        (group) => group.category === 'instrument',
      );
      expect(instruments.flatMap((group) => group.values)).toEqual([
        'double bass',
      ]);
    },
  );

  it('preserves double bass and generic bass when both are explicit', () => {
    const instruments = parseWithRules(
      'double bass and bass guitar',
      'en',
    ).traitGroups.filter((group) => group.category === 'instrument');
    expect(instruments.flatMap((group) => group.values)).toEqual(
      expect.arrayContaining(['double bass', 'bass']),
    );
  });

  it.each([
    ['artists with piano in their songs', 'en'],
    ['artistas con piano en sus canciones', 'es'],
  ] as const)('keeps artists primary in %s', (request, locale) => {
    expect(parseWithRules(request, locale).target).toBe('artist');
  });

  it.each([
    ['wordless vocals', 'en'],
    ['voz sin palabras', 'es'],
  ] as const)('recognizes %s without adding lead vocals', (request, locale) => {
    const vocals = parseWithRules(request, locale).traitGroups.filter(
      (group) => group.category === 'vocal-style',
    );
    expect(vocals.flatMap((group) => group.values)).toContain('wordless vocal');
    expect(vocals.flatMap((group) => group.values)).not.toContain('lead vocal');
  });

  it.each([
    ['piano and bass with trumpet or violin', 'en'],
    ['piano y bajo con trompeta o violín', 'es'],
  ] as const)(
    'keeps local AND and OR instrument groups in %s',
    (request, locale) => {
      const instruments = parseWithRules(request, locale).traitGroups.filter(
        (group) => group.category === 'instrument',
      );
      expect(instruments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            operator: 'AND',
            values: expect.arrayContaining(['piano', 'bass']),
          }),
          expect.objectContaining({
            operator: 'OR',
            values: expect.arrayContaining(['trumpet', 'violin']),
          }),
        ]),
      );
    },
  );

  it.each([
    ['piano and bass for work or study', 'AND'],
    ['piano or bass', 'OR'],
  ] as const)('uses %s as an %s instrument request', (request, operator) => {
    const instruments = parseWithRules(request, 'en').traitGroups.find(
      (group) => group.category === 'instrument',
    );
    expect(instruments).toMatchObject({
      operator,
      values: expect.arrayContaining(['piano', 'bass']),
    });
  });

  it('infers a mixed result when the user does not name an entity type', () => {
    expect(parseWithRules('piano y bajo con melodía', 'es').target).toBe(
      'mixed',
    );
  });

  it('infers a mixed result for an explicit combination of entity types', () => {
    expect(
      parseWithRules('Recomienda artistas y canciones con piano', 'es').target,
    ).toBe('mixed');
  });

  it('extracts native Spotify filters', () => {
    const intent = parseWithRules(
      'genre:metal year:1982 label:"Example Records" tag:new',
      'en',
    );
    expect(intent.nativeFilters).toEqual({
      genre: 'metal',
      year: '1982',
      label: 'Example Records',
      tag: 'new',
    });
  });

  it.each([
    111, 174, 285, 396, 415, 417, 430, 432, 440, 442, 528, 639, 741, 852, 963,
  ])('asks what an ambiguous %i Hz request means', (frequency) => {
    const intent = parseWithRules(`${frequency} Hz piano`, 'en');
    expect(intent.clarification).toEqual({
      id: 'frequency-meaning',
      frequency,
      options: ['tuning', 'tone'],
    });
  });

  it('separates established tuning references from exploratory tone keywords', () => {
    expect(
      ALL_CHIPS.filter((chip) =>
        [
          '415hz',
          '430hz',
          '432hz',
          '440hz',
          '442hz',
          '111hz',
          '174hz',
          '285hz',
          '396hz',
          '417hz',
          '432hz-tone',
          '528hz',
          '639hz',
          '741hz',
          '852hz',
          '963hz',
        ].includes(chip.id),
      ).map(({ id, category, value }) => ({ id, category, value })),
    ).toEqual([
      { id: '415hz', category: 'tuning', value: 'A4=415 Hz tuning' },
      { id: '430hz', category: 'tuning', value: 'A4=430 Hz tuning' },
      { id: '432hz', category: 'tuning', value: 'A4=432 Hz tuning' },
      { id: '440hz', category: 'tuning', value: 'A4=440 Hz tuning' },
      { id: '442hz', category: 'tuning', value: 'A4=442 Hz tuning' },
      { id: '111hz', category: 'tone', value: '111 Hz tone' },
      { id: '174hz', category: 'tone', value: '174 Hz tone' },
      { id: '285hz', category: 'tone', value: '285 Hz tone' },
      { id: '396hz', category: 'tone', value: '396 Hz tone' },
      { id: '417hz', category: 'tone', value: '417 Hz tone' },
      { id: '432hz-tone', category: 'tone', value: '432 Hz tone' },
      { id: '528hz', category: 'tone', value: '528 Hz tone' },
      { id: '639hz', category: 'tone', value: '639 Hz tone' },
      { id: '741hz', category: 'tone', value: '741 Hz tone' },
      { id: '852hz', category: 'tone', value: '852 Hz tone' },
      { id: '963hz', category: 'tone', value: '963 Hz tone' },
    ]);
  });

  it('does not clarify an explicit tuning request', () => {
    const intent = parseWithRules('A4 tuning at 432 Hz with violin', 'en');
    expect(intent.clarification).toBeUndefined();
    expect(intent.traitGroups).toContainEqual(
      expect.objectContaining({ values: ['A4=432 Hz tuning'] }),
    );
  });

  it('creates three substantive routes for piano, bass, and melody', () => {
    const intent = parseWithRules(
      'Quiero que encuentren artistas que utilicen piano, bajo y alguna melodía en sus canciones.',
      'es',
    );
    const candidates = compileCandidateQueries(intent);

    expect(intent.target).toBe('artist');
    expect(intent.routes).toHaveLength(3);
    expect(candidates).toHaveLength(3);
    expect(candidates.map((candidate) => candidate.query)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('piano bass duo melodic'),
        expect.stringContaining('piano trio melodic bass'),
        expect.stringContaining('piano-led instrumental contemporary jazz'),
      ]),
    );
    expect(candidates.every((candidate) => candidate.query !== 'piano')).toBe(
      true,
    );
    expect(candidates.every((candidate) => candidate.query !== 'bass')).toBe(
      true,
    );
    expect(
      intent.routes.every((route) => route.recommendations.length === 0),
    ).toBe(true);
  });

  it('keeps sensitive and subjective concepts as one exploratory search', () => {
    const intent = parseWithRules(
      'healing frequencies for spiritual meditation and therapeutic sound',
      'en',
    );
    const candidates = compileCandidateQueries(intent);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.query).toContain('healing frequencies');
    expect(candidates[0]?.query).toContain('spiritual meditation');
    expect(candidates[0]?.query).toContain('therapeutic sound');
    expect(candidates[0]?.exploratory).toBe(true);
    expect(candidates[0]?.evidence).toContainEqual(
      expect.objectContaining({ kind: 'keyword-based' }),
    );
  });

  it('reports no account quota for guided discovery', () => {
    expect(new RulesProvider().usage()).toEqual({
      providerName: 'Guided discovery',
    });
  });
});
