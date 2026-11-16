import {
  bouquetTypeOf,
  choiceKey,
  customizationFor,
  customizedPrice,
  describeChoice,
  variantPhoto,
} from './customization';
import { PACKAGING_OPTIONS, RIBBON_OPTIONS } from './data/customization-options';
import { PRODUCTS } from './data/products';

describe('персоналізація готових букетів', () => {
  const rose = PRODUCTS.find((p) => p.category === 'roses')!;
  const author = PRODUCTS.find((p) => p.category === 'bouquets')!;

  it('троянди, півонії й гортензії — монобукети з вибором розміру', () => {
    expect(bouquetTypeOf(rose)).toBe('mono');
    expect(customizationFor(rose, true).allowSize).toBe(true);
  });

  it('авторські й змішані букети не мають вибору розміру', () => {
    expect(['author', 'mixed']).toContain(bouquetTypeOf(author));
    expect(customizationFor(author, false).allowSize).toBe(false);
  });

  it('авторські букети не персоналізуються, троянди — так', () => {
    expect(customizationFor(author, false).enabled).toBe(false);
    expect(customizationFor(rose, true).enabled).toBe(true);
  });

  it('перевизначення в товарі має пріоритет', () => {
    const p = { ...rose, customization: { enabled: false, allowRibbon: false } };
    const cfg = customizationFor(p, true);
    expect(cfg.enabled).toBe(false);
    expect(cfg.allowRibbon).toBe(false);
    expect(cfg.allowPackaging).toBe(true);
  });

  it('ціна = база + доплати за пакування, стрічку й листівку', () => {
    const base = { packagingId: 'white-matte', ribbonId: 'milk', cardText: '' };
    expect(customizedPrice(1000, base)).toBe(1000);
    expect(customizedPrice(1000, { ...base, packagingId: 'powder' })).toBe(1100);
    expect(customizedPrice(1000, { ...base, packagingId: 'transparent', ribbonId: 'blue' })).toBe(1200);
    expect(customizedPrice(1000, { ...base, cardText: 'Привіт' })).toBe(1050);
    expect(customizedPrice(1000, { packagingId: null, ribbonId: null, cardText: '   ' })).toBe(1000);
  });

  it('опис вибору для кошика', () => {
    expect(describeChoice({ packagingId: null, ribbonId: null, cardText: '' })).toEqual([
      'Без пакування',
      'Без стрічки',
    ]);
    expect(describeChoice({ packagingId: 'powder', ribbonId: 'pink', cardText: 'Дякую' })).toEqual([
      'Пакування: пудрове',
      'Стрічка: рожева',
      'Листівка: «Дякую»',
    ]);
  });

  it('фото змінюється разом із пакуванням і стрічкою', () => {
    const red = PRODUCTS.find((p) => p.id === 'classic-red')!;
    expect(variantPhoto(red, 'S', 'powder', 'red')).toEqual({ src: 'flowers/classic-red-s-powder-red.webp', exact: true });
    expect(variantPhoto(red, 'S', null, 'pink')?.src).toContain('none-pink');
    expect(variantPhoto(red, 'S', null, 'blue')?.exact).toBe(true);
    expect(variantPhoto(red, 'S', 'white-matte', 'pink')).toEqual({ src: 'flowers/classic-red-s-white-matte-pink.webp', exact: true });
    expect(variantPhoto(red, 'S', 'white-matte', 'blue')).toEqual({ src: 'flowers/classic-red-s-white-matte-blue.webp', exact: true });
  });

  it('є фото для кожної комбінації пакування й стрічки (розмір S)', () => {
    const red = PRODUCTS.find((p) => p.id === 'classic-red')!;
    for (const pack of PACKAGING_OPTIONS.map((o) => o.id).concat([null as unknown as string])) {
      for (const ribbon of RIBBON_OPTIONS.map((o) => o.id)) {
        expect(variantPhoto(red, 'S', pack, ribbon)?.exact, `${pack}|${ribbon}`).toBe(true);
      }
    }
  });

  it('персикові, малинові, півонії та мікс гортензій: фото для кожної комбінації в усіх розмірах', () => {
    for (const id of ['spray-peach', 'spray-fuchsia', 'peony-pink', 'peony-duo', 'peony-white', 'hydrangea-mix', 'hydrangea-white', 'hydrangea-blue']) {
      const product = PRODUCTS.find((p) => p.id === id)!;
      for (const size of ['S', 'M', 'L'] as const) {
        for (const pack of PACKAGING_OPTIONS.map((o) => o.id).concat([null as unknown as string])) {
          for (const ribbon of RIBBON_OPTIONS.map((o) => o.id)) {
            expect(variantPhoto(product, size, pack, ribbon)?.exact, `${id} ${size} ${pack}|${ribbon}`).toBe(true);
          }
        }
      }
    }
  });

  it('малинові кущові троянди: головне фото каталогу = пудрове пакування + біла стрічка (S, M, L)', () => {
    const p = PRODUCTS.find((x) => x.id === 'spray-fuchsia')!;
    expect(p.defaultVariant).toEqual({ packagingId: 'powder', ribbonId: 'milk' });
    expect(p.image).toBe(variantPhoto(p, 'M', 'powder', 'milk')!.src);
    for (const size of ['S', 'M', 'L'] as const) {
      expect(p.sizeOverrides?.[size]?.image).toBe(variantPhoto(p, size, 'powder', 'milk')!.src);
    }
  });

  it('малинові кущові троянди: безкоштовні лише пудрове пакування й біла стрічка, інше — доплата', () => {
    const o = PRODUCTS.find((x) => x.id === 'spray-fuchsia')!.optionPrices;
    const base = { packagingId: 'powder', ribbonId: 'milk', cardText: '' };
    expect(customizedPrice(2400, base, o)).toBe(2400);
    expect(customizedPrice(2400, { ...base, packagingId: 'white-matte' }, o)).toBe(2500);
    expect(customizedPrice(2400, { ...base, packagingId: 'transparent' }, o)).toBe(2550);
    expect(customizedPrice(2400, { ...base, ribbonId: 'red' }, o)).toBe(2430);
    // для інших букетів діють спільні ціни
    expect(customizedPrice(2400, { ...base, packagingId: 'powder' })).toBe(2500);
  });

  it('рожеві півонії: головне фото каталогу = рожеве пакування + біла стрічка (S, M, L), безкоштовні лише вони', () => {
    const p = PRODUCTS.find((x) => x.id === 'peony-pink')!;
    expect(p.defaultVariant).toEqual({ packagingId: 'powder', ribbonId: 'milk' });
    expect(p.image).toBe(variantPhoto(p, 'M', 'powder', 'milk')!.src);
    for (const size of ['S', 'M', 'L'] as const) {
      expect(p.sizeOverrides?.[size]?.image).toBe(variantPhoto(p, size, 'powder', 'milk')!.src);
    }
    const base = { packagingId: 'powder', ribbonId: 'milk', cardText: '' };
    expect(customizedPrice(2600, base, p.optionPrices)).toBe(2600);
    expect(customizedPrice(2600, { ...base, packagingId: 'white-matte' }, p.optionPrices)).toBe(2700);
    expect(customizedPrice(2600, { ...base, ribbonId: 'blue' }, p.optionPrices)).toBe(2650);
  });

  it('рожево-білі півонії: головне фото каталогу = біле пакування + рожева стрічка (S, M, L), безкоштовні лише вони', () => {
    const p = PRODUCTS.find((x) => x.id === 'peony-duo')!;
    expect(p.defaultVariant).toEqual({ packagingId: 'white-matte', ribbonId: 'pink' });
    expect(p.image).toBe(variantPhoto(p, 'M', 'white-matte', 'pink')!.src);
    for (const size of ['S', 'M', 'L'] as const) {
      expect(p.sizeOverrides?.[size]?.image).toBe(variantPhoto(p, size, 'white-matte', 'pink')!.src);
    }
    const base = { packagingId: 'white-matte', ribbonId: 'pink', cardText: '' };
    expect(customizedPrice(2800, base, p.optionPrices)).toBe(2800);
    expect(customizedPrice(2800, { ...base, ribbonId: 'milk' }, p.optionPrices)).toBe(2830);
    expect(customizedPrice(2800, { ...base, ribbonId: 'blue' }, p.optionPrices)).toBe(2850);
    expect(customizedPrice(2800, { ...base, packagingId: 'powder' }, p.optionPrices)).toBe(2900);
    expect(customizedPrice(2800, { ...base, packagingId: 'transparent' }, p.optionPrices)).toBe(2950);
  });

  it('мікс гортензій: головне фото каталогу = біле пакування + блакитна стрічка (S, M, L), безкоштовні лише вони', () => {
    const p = PRODUCTS.find((x) => x.id === 'hydrangea-mix')!;
    expect(p.defaultVariant).toEqual({ packagingId: 'white-matte', ribbonId: 'blue' });
    expect(p.image).toBe(variantPhoto(p, 'M', 'white-matte', 'blue')!.src);
    for (const size of ['S', 'M', 'L'] as const) {
      expect(p.sizeOverrides?.[size]?.image).toBe(variantPhoto(p, size, 'white-matte', 'blue')!.src);
    }
    const base = { packagingId: 'white-matte', ribbonId: 'blue', cardText: '' };
    expect(customizedPrice(4900, base, p.optionPrices)).toBe(4900);
    expect(customizedPrice(4900, { ...base, ribbonId: 'milk' }, p.optionPrices)).toBe(4930);
    expect(customizedPrice(4900, { ...base, ribbonId: 'red' }, p.optionPrices)).toBe(4930);
  });

  it('рожеві гортензії: головне фото = біле пакування + рожева стрічка (S, M, L), фото всіх комбінацій', () => {
    const p = PRODUCTS.find((x) => x.id === 'hydrangea-pink')!;
    expect(p.defaultVariant).toEqual({ packagingId: 'white-matte', ribbonId: 'pink' });
    expect(p.image).toBe(variantPhoto(p, 'M', 'white-matte', 'pink')!.src);
    for (const size of ['S', 'M', 'L'] as const) {
      expect(p.sizeOverrides?.[size]?.image).toBe(variantPhoto(p, size, 'white-matte', 'pink')!.src);
      for (const pack of PACKAGING_OPTIONS.map((o) => o.id).concat([null as unknown as string])) {
        for (const ribbon of RIBBON_OPTIONS.map((o) => o.id)) {
          // бракує лише фото M: прозоре пакування + біла стрічка
          if (size === 'M' && pack === 'transparent' && ribbon === 'milk') continue;
          expect(variantPhoto(p, size, pack, ribbon)?.exact, `${size} ${pack}|${ribbon}`).toBe(true);
        }
      }
    }
    const base = { packagingId: 'white-matte', ribbonId: 'pink', cardText: '' };
    expect(customizedPrice(1800, base, p.optionPrices)).toBe(1800);
    expect(customizedPrice(1800, { ...base, ribbonId: 'milk' }, p.optionPrices)).toBe(1830);
  });

  it('білі й блакитні гортензії: головне фото каталогу — біле пакування + біла / блакитна стрічка (S, M, L)', () => {
    for (const [id, ribbon] of [['hydrangea-white', 'milk'], ['hydrangea-blue', 'blue']] as const) {
      const p = PRODUCTS.find((x) => x.id === id)!;
      expect(p.defaultVariant).toEqual({ packagingId: 'white-matte', ribbonId: ribbon });
      expect(p.image).toBe(variantPhoto(p, 'M', 'white-matte', ribbon)!.src);
      for (const size of ['S', 'M', 'L'] as const) {
        expect(p.sizeOverrides?.[size]?.image, id + ' ' + size).toBe(variantPhoto(p, size, 'white-matte', ribbon)!.src);
      }
    }
    const blue = PRODUCTS.find((x) => x.id === 'hydrangea-blue')!;
    const base = { packagingId: 'white-matte', ribbonId: 'blue', cardText: '' };
    expect(customizedPrice(3200, base, blue.optionPrices)).toBe(3200);
    expect(customizedPrice(3200, { ...base, ribbonId: 'milk' }, blue.optionPrices)).toBe(3230);
  });

  it('білі півонії: головне фото каталогу = біле пакування + біла стрічка, своє для кожного розміру S, M, L', () => {
    const p = PRODUCTS.find((x) => x.id === 'peony-white')!;
    expect(p.defaultVariant).toEqual({ packagingId: 'white-matte', ribbonId: 'milk' });
    expect(p.image).toBe(variantPhoto(p, 'M', 'white-matte', 'milk')!.src);
    const srcs = new Set<string>();
    for (const size of ['S', 'M', 'L'] as const) {
      const src = variantPhoto(p, size, 'white-matte', 'milk')!.src;
      expect(p.sizeOverrides?.[size]?.image).toBe(src);
      srcs.add(src);
    }
    expect(srcs.size).toBe(3);
    expect(customizedPrice(2800, { packagingId: 'white-matte', ribbonId: 'milk', cardText: '' }, p.optionPrices)).toBe(2800);
  });

  it('якщо точної комбінації немає — найближче фото з позначкою «умовне»', () => {
    const red = PRODUCTS.find((p) => p.id === 'classic-red')!;
    // невідоме пакування: беремо фото з тією самою стрічкою, але позначаємо як умовне
    expect(variantPhoto(red, 'S', 'unknown', 'pink')?.exact).toBe(false);
    expect(variantPhoto(red, 'S', 'unknown', 'pink')?.src).toContain('-pink');
    // такого пакування на фото немає зовсім: беремо фото з тією ж стрічкою
    expect(variantPhoto(red, 'S', 'unknown', 'pink')?.exact).toBe(false);
    // розмір без власних фото-варіантів: беремо фото іншого розміру, але позначаємо як умовне
    const onlyS = { ...red, photoVariants: { S: red.photoVariants!.S } };
    expect(variantPhoto(onlyS, 'L', 'powder', 'red')).toEqual({ src: 'flowers/classic-red-s-powder-red.webp', exact: false });
    // розміри S, M і L мають власні фото — точний збіг
    expect(variantPhoto(red, 'M', 'powder', 'red')).toEqual({ src: 'flowers/classic-red-m-powder-red.webp', exact: true });
    expect(variantPhoto(red, 'L', 'powder', 'red')).toEqual({ src: 'flowers/classic-red-l-powder-red.webp', exact: true });
    // товар без фото-варіантів взагалі
    expect(variantPhoto(PRODUCTS.find((p) => !p.photoVariants)!, 'M', 'powder', 'red')).toBeNull();
  });

  it('різні налаштування одного букета мають різні ключі в кошику', () => {
    const a = choiceKey('x', { size: 'M', packagingId: 'powder', ribbonId: 'red', cardText: '' });
    const b = choiceKey('x', { size: 'M', packagingId: 'powder', ribbonId: 'pink', cardText: '' });
    const c = choiceKey('x', { size: 'M', packagingId: 'powder', ribbonId: 'red', cardText: 'Привіт' });
    expect(new Set([a, b, c]).size).toBe(3);
    expect(choiceKey('x', { size: 'M', packagingId: 'powder', ribbonId: 'red', cardText: '' })).toBe(a);
  });
});
