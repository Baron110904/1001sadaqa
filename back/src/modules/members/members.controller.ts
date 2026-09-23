import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MemberStatus, Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MembersService } from './members.service';
import {
  CreateContributionDto,
  CreateMemberDto,
  DecideMemberDto,
  UpdateMemberDto,
} from './dto/member.dto';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  /**
   * Demande d'adhésion, déposée depuis le site public.
   *
   * Limitée comme les autres formulaires publics : une demande d'adhésion
   * n'est pas un geste qu'on répète dix fois par minute.
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @Post('request')
  request(@Body() dto: CreateMemberDto) {
    return this.members.request(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get()
  findAll(@Query('status') status?: MemberStatus) {
    return this.members.findAllAdmin(status);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('summary')
  summary() {
    return this.members.summary();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.members.findOneAdmin(id);
  }

  // L'adhésion engage l'association : la décision relève de l'administration.
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id/decision')
  decide(@Param('id') id: string, @Body() dto: DecideMemberDto) {
    return this.members.decide(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.members.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.members.remove(id);
  }

  // ── Cotisations ──────────────────────────────────────────────────────────

  /** Versement reçu hors ligne, saisi par la trésorerie. */
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post(':id/contributions')
  addContribution(@Param('id') id: string, @Body() dto: CreateContributionDto) {
    return this.members.addContribution(id, dto, true);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('contributions/:id/confirm')
  confirmContribution(@Param('id') id: string) {
    return this.members.confirmContribution(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('contributions/:id')
  removeContribution(@Param('id') id: string) {
    return this.members.removeContribution(id);
  }
}
