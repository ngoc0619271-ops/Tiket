import { describe, expect, it } from 'vitest';
import { AppError, created, fail, fromError, ok } from '@/server/lib/http';

describe('http helpers', () => {
  describe('AppError', () => {
    it('has .status not .statusCode', () => {
      const err = new AppError('NOT_FOUND', 'missing', 404);
      expect(err.status).toBe(404);
      expect(err.message).toBe('missing');
      expect(err.code).toBe('NOT_FOUND');
      expect(err.name).toBe('AppError');
    });

    it('defaults status to 400', () => {
      const err = new AppError('INVALID_INPUT', 'bad input');
      expect(err.status).toBe(400);
    });
  });

  describe('ok()', () => {
    it('wraps data in ok envelope', async () => {
      const res = ok({ id: '123' });
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe('123');
    });

    it('accepts init options', async () => {
      const res = ok({ id: '456' }, { status: 201 });
      expect(res.status).toBe(201);
    });
  });

  describe('created()', () => {
    it('returns 201 status', async () => {
      const res = created({ id: 'abc' });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });
  });

  describe('fail()', () => {
    it('returns error envelope', async () => {
      const res = fail('NOT_FOUND', 'missing', 404);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('NOT_FOUND');
    });
  });

  describe('fromError()', () => {
    it('handles AppError', async () => {
      const err = new AppError('CONFLICT', 'already exists', 409);
      const res = fromError(err);
      expect(res.status).toBe(409);
    });

    it('handles ZodError using .issues', async () => {
      const zodErr = {
        name: 'ZodError',
        issues: [{ path: ['field'], message: 'Required' }],
      };
      const res = fromError(zodErr);
      expect(res.status).toBe(400);
    });

    it('handles unknown errors as 500', async () => {
      const res = fromError(new Error('unexpected'));
      expect(res.status).toBe(500);
    });
  });
});
