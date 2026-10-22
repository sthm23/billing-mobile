import {
  Button,
  Chip,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputField,
  Text,
  TextArea,
} from "@/components/base";
import { PaymentType } from "@/models/order.model";
import { CashTransactionCategory, CashTransactionType } from "@/models/payment.model";
import { CreateTransactionPayload } from "@/services/cashbox/cashbox.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod";

const transactionSchema = z.object({
  category: z.nativeEnum(CashTransactionCategory, {
    message: "Category is required",
  }),
  paymentType: z.nativeEnum(PaymentType, {
    message: "Payment type is required",
  }),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  comment: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

type TransactionFormProps = {
  cashboxId: string;
  transactionType: CashTransactionType;
  onSubmit: (payload: CreateTransactionPayload) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export const TransactionForm = ({
  cashboxId,
  transactionType,
  onSubmit: onSubmitProp,
  onCancel,
  isLoading = false,
}: TransactionFormProps) => {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      category: CashTransactionCategory.OTHER,
      paymentType: PaymentType.CASH,
      amount: "",
      comment: "",
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    try {
      await onSubmitProp({
        cashboxId,
        type: transactionType,
        category: data.category,
        paymentType: data.paymentType,
        amount: Number(data.amount),
        comment: data.comment || "",
        orderId: null,
      });
    } catch (error) {
      console.error("Failed to create transaction:", error);
    }
  };

  const categoryOptions = Object.values(CashTransactionCategory);
  const paymentTypeOptions = Object.values(PaymentType);

  return (
    <View className="gap-4">
      {/* Amount */}
      <FormControl isInvalid={!!errors.amount}>
        <FormControlLabel>
          <FormControlLabelText>{t('payment.amount')}</FormControlLabelText>
        </FormControlLabel>
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <Input size="lg" invalid={!!errors.amount} className="h-16">
              <InputField
                placeholder="0"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                className="font-onest-bold text-[28px]"
              />
              <Text className="font-onest-medium text-[15px] text-muted">{t('common.currency')}</Text>
            </Input>
          )}
        />
        {errors.amount && (
          <FormControlError>
            <FormControlErrorText>{errors.amount.message}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Category */}
      <FormControl isInvalid={!!errors.category}>
        <FormControlLabel>
          <FormControlLabelText>{t('payment.category.name')}</FormControlLabelText>
        </FormControlLabel>
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row flex-wrap gap-2">
              {categoryOptions.map((category) => (
                <Chip
                  key={category}
                  label={t(`payment.category.${category}`)}
                  tone="sunken"
                  selected={value === category}
                  onPress={() => onChange(category)}
                />
              ))}
            </View>
          )}
        />
        {errors.category && (
          <FormControlError>
            <FormControlErrorText>{errors.category.message}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Payment method */}
      <FormControl isInvalid={!!errors.paymentType}>
        <FormControlLabel>
          <FormControlLabelText>{t('order.paymentMethod.name')}</FormControlLabelText>
        </FormControlLabel>
        <Controller
          control={control}
          name="paymentType"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row flex-wrap gap-2">
              {paymentTypeOptions.map((type) => (
                <Chip
                  key={type}
                  label={t(`order.paymentMethod.${type}`)}
                  tone="sunken"
                  size="lg"
                  selected={value === type}
                  onPress={() => onChange(type)}
                />
              ))}
            </View>
          )}
        />
        {errors.paymentType && (
          <FormControlError>
            <FormControlErrorText>{errors.paymentType.message}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Comment */}
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText>{t('payment.comment')}</FormControlLabelText>
        </FormControlLabel>
        <Controller
          control={control}
          name="comment"
          render={({ field: { onChange, value } }) => (
            <TextArea
              placeholder={t('payment.comment')}
              value={value}
              onChangeText={onChange}
              rows={3}
            />
          )}
        />
      </FormControl>

      {/* Actions */}
      <View className="flex-row gap-2.5 mt-2">
        <Button variant="secondary" size="lg" className="flex-1" onPress={onCancel} disabled={isLoading}>
          {t('order.cancel')}
        </Button>
        <Button variant="accent" size="lg" className="flex-1" onPress={handleSubmit(onSubmit)} loading={isLoading}>
          {t('payment.save')}
        </Button>
      </View>
    </View>
  );
};
