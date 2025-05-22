import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((res: unknown) => this.responseHandler(res, context)),
      catchError((err: HttpException) => {
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let data = {};

        console.log('Err: ', JSON.stringify(err, null, 2));

        if (typeof err.getStatus === 'function') {
          status = err.getStatus();
        }
        if (typeof err.getResponse === 'function') {
          data = err.getResponse();
        }
        return throwError(() => this.errorHandler(err, status, data, context));
      }),
    );
  }

  errorHandler(
    exception: any,
    status: number,
    data: object,
    context: ExecutionContext,
  ): object {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      return exception;
    } else {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      message,
      data,
    });

    return {
      success: false,
      statusCode: status,
      message,
      data,
    };
  }

  responseHandler(res: any, context: ExecutionContext): object {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const statusCode = response.statusCode;

    return {
      success: true,
      path: request.url,
      statusCode,
      data: res,
    };
  }
}