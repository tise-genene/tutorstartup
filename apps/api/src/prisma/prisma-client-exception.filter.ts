import {
  ArgumentsHost,
  Catch,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
@Catch(PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  constructor(httpAdapterHost: HttpAdapterHost) {
    super(httpAdapterHost.httpAdapter);
  }

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (exception.code === 'P2002') {
      return super.catch(
        new ConflictException('Resource already exists'),
        host,
      );
    }

    if (exception.code === 'P2025') {
      return super.catch(new NotFoundException('Resource not found'), host);
    }

    return super.catch(exception, host);
  }
}
