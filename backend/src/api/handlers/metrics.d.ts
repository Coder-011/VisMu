import { Request, Response } from 'express';
export declare const getPerformance: (req: Request, res: Response) => Promise<void>;
export declare const logEvent: (req: Request, res: Response) => Promise<void>;
export declare const getSessionMetrics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=metrics.d.ts.map