import { Type } from 'class-transformer';
import { IsISO4217CurrencyCode, IsNumber, Min } from 'class-validator';

export class ConvertQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsISO4217CurrencyCode()
  from!: string;

  @IsISO4217CurrencyCode()
  to!: string;
}

export class RatesQueryDto {
  @IsISO4217CurrencyCode()
  base!: string;
}