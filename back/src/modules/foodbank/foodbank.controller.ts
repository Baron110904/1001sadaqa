import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { FoodbankRequestKind, Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FoodbankService } from './foodbank.service';
import {
  CreateCategoryDto,
  CreateMovementDto,
  UpdateCategoryDto,
  UpdateMovementDto,
} from './dto/foodbank.dto';
import {
  CreateFoodbankCommentDto,
  CreateFoodbankRequestDto,
  UpdateFoodbankCommentDto,
  UpdateFoodbankRequestDto,
} from './dto/request.dto';

@ApiTags('foodbank')
@Controller('foodbank')
export class FoodbankController {
  constructor(private readonly foodbank: FoodbankService) {}

  /**
   * Tout l'état de l'entrepôt, en une lecture.
   *
   * Les niveaux sont publics par choix : c'est ce qui permet à un donateur de
   * savoir quoi apporter avant de se déplacer, et à l'association de ne pas
   * recevoir dix fois la même denrée.
   */
  @Public()
  @Get()
  overview() {
    return this.foodbank.overview();
  }

  /** Registre complet des mouvements. */
  @Public()
  @Get('movements')
  movements(@Query('limit') limit?: string) {
    const demande = Number(limit);
    return this.foodbank.movements(Number.isFinite(demande) ? Math.min(demande, 200) : 60);
  }

  /**
   * Classement public des donateurs, en nature et en argent.
   *
   * Les dons anonymes n'y figurent pas : ils sont écartés côté serveur, pas
   * masqués à l'affichage.
   */
  @Public()
  @Get('donors')
  donors(@Query('produit') produit?: string, @Query('type') type?: string) {
    return this.foodbank.donors({
      product: produit || undefined,
      type: type === 'nature' || type === 'financier' ? type : undefined,
    });
  }

  /** Mots publiés des personnes accompagnées. */
  @Public()
  @Get('comments')
  comments() {
    return this.foodbank.comments();
  }

  /**
   * Dépôt d'une demande : apporter une denrée, ou en recevoir.
   *
   * Limité comme les autres formulaires publics : un dépôt engage un échange
   * avec l'association, pas un clic répété.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @Post('requests')
  createRequest(@Body() dto: CreateFoodbankRequestDto) {
    return this.foodbank.createRequest(dto);
  }

  @Public()
  @Throttle({ default: { limit: 4, ttl: 300_000 } })
  @Post('comments')
  createComment(@Body() dto: CreateFoodbankCommentDto) {
    return this.foodbank.createComment(dto);
  }

  // ── Administration ───────────────────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin/requests')
  findRequests(@Query('kind') kind?: string) {
    return this.foodbank.findRequests(
      kind === 'DON' || kind === 'RETRAIT' ? (kind as FoodbankRequestKind) : undefined,
    );
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch('requests/:id')
  updateRequest(@Param('id') id: string, @Body() dto: UpdateFoodbankRequestDto) {
    return this.foodbank.updateRequest(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('requests/:id')
  removeRequest(@Param('id') id: string) {
    return this.foodbank.removeRequest(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin/comments')
  findCommentsAdmin() {
    return this.foodbank.findCommentsAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch('comments/:id')
  updateComment(@Param('id') id: string, @Body() dto: UpdateFoodbankCommentDto) {
    return this.foodbank.updateComment(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Delete('comments/:id')
  removeComment(@Param('id') id: string) {
    return this.foodbank.removeComment(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin/categories')
  findAllAdmin() {
    return this.foodbank.findAllAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.foodbank.createCategory(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.foodbank.updateCategory(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.foodbank.removeCategory(id);
  }

  /**
   * Enregistrer un mouvement est le geste quotidien de la banque : il est
   * ouvert aux éditeurs, alors que la définition des catégories et des seuils
   * reste à l'administration.
   */
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Post('movements')
  createMovement(@Body() dto: CreateMovementDto) {
    return this.foodbank.createMovement(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch('movements/:id')
  updateMovement(@Param('id') id: string, @Body() dto: UpdateMovementDto) {
    return this.foodbank.updateMovement(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('movements/:id')
  removeMovement(@Param('id') id: string) {
    return this.foodbank.removeMovement(id);
  }
}
