import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

/**
 * Traduit les erreurs Prisma connues en réponses HTTP explicites, plutôt que
 * de laisser fuiter un 500 et le détail de la requête SQL.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[] | undefined)?.join(', ');
        return super.catch(
          new ConflictException(
            target
              ? `Une entrée existe déjà avec cette valeur (${target}).`
              : 'Une entrée existe déjà avec cette valeur.',
          ),
          host,
        );
      }
      case 'P2025':
        return super.catch(new NotFoundException('Ressource introuvable.'), host);
      default:
        return super.catch(exception, host);
    }
  }
}
