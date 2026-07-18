import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MinLength,
} from "class-validator";

/** Espelha `signupSchema` de @peopleflow/contracts — validação na borda. */
export class SignupDto {
  @ApiProperty({ example: "acme", description: "Subdomínio do tenant" })
  @IsString()
  @Length(3, 40)
  @Matches(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)
  tenantSlug!: string;

  @ApiProperty({ example: "Grupo Acme" })
  @IsString()
  @Length(2, 120)
  organizationName!: string;

  @ApiProperty({ example: "Acme Tecnologia LTDA" })
  @IsString()
  @Length(2, 120)
  companyName!: string;

  @ApiProperty({ example: "Maria Silva" })
  @IsString()
  @Length(2, 120)
  adminName!: string;

  @ApiProperty({ example: "maria@acme.com" })
  @IsEmail()
  adminEmail!: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  adminPassword!: string;
}

export class LoginDto {
  @ApiProperty({ example: "acme" })
  @IsString()
  @Length(3, 40)
  tenantSlug!: string;

  @ApiProperty({ example: "maria@acme.com" })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ description: "Refresh token opaco recebido no login" })
  @IsString()
  refreshToken!: string;
}
