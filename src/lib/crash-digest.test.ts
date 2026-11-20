import { describe, expect, it } from 'vitest';
import { digestMessage, groupCrashes, signature } from './crash-digest';

const trace = (error: string, where: string) =>
  `Thread: main\n${error}\n\tat android.os.Handler.dispatch(Handler.java:1)\n\tat ${where}\n\tat android.os.Looper.loop(Looper.java:2)`;

const row = (error: string, where: string, app = '1.0.25') =>
  ({ app, android: '15', model: 'Samsung SM-A155F', trace: trace(error, where) });

describe('signature', () => {
  it('takes the error and the first line in our own code', () => {
    expect(signature(trace('java.lang.IllegalStateException', 'com.akai.nativekb.PanelView.onDraw(PanelView.kt:412)'))).toEqual({
      error: 'java.lang.IllegalStateException',
      where: 'com.akai.nativekb.PanelView.onDraw(PanelView.kt:412)',
    });
  });
  it('falls back to the first code line when none is ours', () => {
    expect(signature('java.lang.OutOfMemoryError\n\tat android.graphics.Bitmap.create(Bitmap.java:9)').where)
      .toBe('android.graphics.Bitmap.create(Bitmap.java:9)');
  });
});

describe('groupCrashes', () => {
  it('groups identical crashes, most frequent first, with their versions', () => {
    const g = groupCrashes([
      row('java.lang.A', 'com.akai.X.a(X.kt:1)', '1.0.24'),
      row('java.lang.B', 'com.akai.Y.b(Y.kt:2)'),
      row('java.lang.A', 'com.akai.X.a(X.kt:1)', '1.0.25'),
    ]);
    expect(g.map((x) => [x.error, x.count])).toEqual([['java.lang.A', 2], ['java.lang.B', 1]]);
    expect(g[0].versions.sort()).toEqual(['1.0.24', '1.0.25']);
  });
});

describe('digestMessage', () => {
  it('says nothing when there were no crashes', () => {
    expect(digestMessage([])).toBeNull();
  });
  it('summarises and stays within Telegram’s limit', () => {
    const rows = Array.from({ length: 40 }, (_, i) => row(`java.lang.E${i % 12}`, `com.akai.Z.f${i % 12}(Z.kt:${i})`));
    const text = digestMessage(rows)!;
    expect(text).toContain('40 crash reports');
    expect(text).toContain('…and');
    expect(text.length).toBeLessThanOrEqual(4000);
  });
});
