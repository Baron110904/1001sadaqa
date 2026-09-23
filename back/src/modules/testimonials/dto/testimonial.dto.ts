import { PartialType } from '@nestjs/swagger';
import { TestimonialType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsString()
  @MinLength(10)
  content!: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsEnum(TestimonialType)
  type?: TestimonialType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}
